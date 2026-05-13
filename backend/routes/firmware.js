import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../uploads/firmware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router();
router.use(authenticateToken, requireAdmin);

// Список всех версий ПО
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.id, f.version, f.filename, f.size, f.notes, f.created_at,
             u.email as uploaded_by_email,
             (f.created_at = (SELECT MAX(created_at) FROM firmware)) as is_latest
      FROM firmware f
      LEFT JOIN users u ON f.uploaded_by = u.id
      ORDER BY f.created_at DESC
    `);
    res.json({ firmware: result.rows });
  } catch (error) {
    console.error('Get firmware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Загрузить новую версию ПО
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  const { version, notes } = req.body;
  if (!version) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Версия обязательна' });
  }

  try {
    const existing = await pool.query('SELECT id FROM firmware WHERE version = $1', [version]);
    if (existing.rows.length > 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: `Версия ${version} уже существует` });
    }

    const result = await pool.query(
      `INSERT INTO firmware (version, filename, filepath, size, notes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, version, filename, size, notes, created_at`,
      [version, req.file.originalname, req.file.path, req.file.size, notes || null, req.user.id]
    );
    res.status(201).json({ firmware: result.rows[0] });
  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    console.error('Upload firmware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Удалить версию ПО
router.delete('/:id', async (req, res) => {
  try {
    const fw = await pool.query('SELECT * FROM firmware WHERE id = $1', [req.params.id]);
    if (fw.rows.length === 0) return res.status(404).json({ error: 'Не найдено' });

    try { fs.unlinkSync(fw.rows[0].filepath); } catch {}

    await pool.query('DELETE FROM firmware WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete firmware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Отправить обновление принудительно (на все или одно устройство)
router.post('/:id/push', async (req, res) => {
  const { device_id } = req.body;
  const io = req.app.get('io');
  try {
    const fw = await pool.query('SELECT * FROM firmware WHERE id = $1', [req.params.id]);
    if (fw.rows.length === 0) return res.status(404).json({ error: 'Версия не найдена' });

    let devices;
    if (device_id) {
      const d = await pool.query('SELECT id, serial_number FROM devices WHERE id = $1 AND is_active = true', [device_id]);
      devices = d.rows;
    } else {
      const d = await pool.query('SELECT id, serial_number FROM devices WHERE is_active = true');
      devices = d.rows;
    }

    if (devices.length === 0) return res.status(400).json({ error: 'Нет активных устройств' });

    for (const dev of devices) {
      await pool.query(
        `INSERT INTO firmware_update_tasks (firmware_id, device_id, status, sent_at)
         VALUES ($1, $2, 'sent', CURRENT_TIMESTAMP)`,
        [fw.rows[0].id, dev.id]
      );
      io.emit(`fw:update:${dev.serial_number}`, {
        version: fw.rows[0].version,
        filename: fw.rows[0].filename,
        size: fw.rows[0].size,
        download_url: `/api/firmware/${fw.rows[0].id}/download`
      });
    }

    if (device_id) {
      await pool.query('UPDATE devices SET fw_update_available = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [device_id]);
    } else {
      await pool.query('UPDATE devices SET fw_update_available = false, updated_at = CURRENT_TIMESTAMP WHERE is_active = true');
    }

    res.json({ message: `Обновление отправлено на ${devices.length} устройств(а)`, count: devices.length });
  } catch (error) {
    console.error('Push firmware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Запланировать обновление на 03:00
router.post('/:id/schedule', async (req, res) => {
  const { device_id } = req.body;
  try {
    const fw = await pool.query('SELECT id, version FROM firmware WHERE id = $1', [req.params.id]);
    if (fw.rows.length === 0) return res.status(404).json({ error: 'Версия не найдена' });

    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(3, 0, 0, 0);
    if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1);

    let devices;
    if (device_id) {
      const d = await pool.query('SELECT id, serial_number FROM devices WHERE id = $1', [device_id]);
      devices = d.rows;
    } else {
      const d = await pool.query('SELECT id, serial_number FROM devices WHERE is_active = true');
      devices = d.rows;
    }

    if (devices.length === 0) return res.status(400).json({ error: 'Нет устройств' });

    for (const dev of devices) {
      await pool.query(
        `DELETE FROM firmware_update_tasks WHERE device_id = $1 AND status = 'pending'`,
        [dev.id]
      );
      await pool.query(
        `INSERT INTO firmware_update_tasks (firmware_id, device_id, scheduled_at, status)
         VALUES ($1, $2, $3, 'pending')`,
        [fw.rows[0].id, dev.id, scheduled]
      );
      await pool.query(
        'UPDATE devices SET fw_update_available = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [dev.id]
      );
    }

    res.json({
      message: `Запланировано на ${scheduled.toLocaleString('ru-RU')} для ${devices.length} устройств(а)`,
      scheduled_at: scheduled,
      count: devices.length
    });
  } catch (error) {
    console.error('Schedule firmware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Скачать файл прошивки
router.get('/:id/download', async (req, res) => {
  try {
    const fw = await pool.query('SELECT * FROM firmware WHERE id = $1', [req.params.id]);
    if (fw.rows.length === 0) return res.status(404).json({ error: 'Не найдено' });
    res.download(fw.rows[0].filepath, fw.rows[0].filename);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
