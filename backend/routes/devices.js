import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// Получить все устройства
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, d.serial_number, d.is_active, d.last_lat, d.last_lng,
             d.last_seen, d.fw_version, d.created_at, d.updated_at,
             u.id as owner_id, u.email as owner_email,
             u.phone, u.phone2, u.phone3,
             (
               SELECT f.version FROM firmware f ORDER BY f.created_at DESC LIMIT 1
             ) as latest_fw_version,
             CASE
               WHEN d.fw_version IS NULL THEN false
               WHEN (SELECT COUNT(*) FROM firmware) = 0 THEN false
               ELSE d.fw_version != (SELECT f.version FROM firmware f ORDER BY f.created_at DESC LIMIT 1)
             END as fw_update_available,
             COALESCE(
               (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'parent_id', c.parent_id))
                FROM device_categories dc
                JOIN categories c ON dc.category_id = c.id
                WHERE dc.device_id = d.id),
               '[]'
             ) as categories
      FROM devices d
      LEFT JOIN users u ON d.owner_id = u.id
      ORDER BY d.is_active DESC, d.serial_number ASC
    `);
    res.json({ devices: result.rows });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Создать устройство
router.post('/', async (req, res) => {
  const { serial_number, fw_version, category_ids } = req.body;
  if (!serial_number) return res.status(400).json({ error: 'serial_number is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO devices (serial_number, fw_version)
       VALUES ($1, $2) RETURNING *`,
      [serial_number, fw_version || null]
    );
    const device = result.rows[0];

    const ids = Array.isArray(category_ids) ? category_ids : [];
    for (const cid of ids) {
      await client.query(
        'INSERT INTO device_categories (device_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [device.id, cid]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ device });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(400).json({ error: 'Серийный номер уже существует' });
    console.error('Create device error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Обновить устройство
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { serial_number, owner_id, is_active, fw_version, category_ids, last_lat, last_lng, last_seen } = req.body;

  // Если назначается владелец — проверить что он не занят другим устройством
  if (owner_id) {
    const conflict = await pool.query(
      'SELECT id, serial_number FROM devices WHERE owner_id = $1 AND id != $2',
      [owner_id, id]
    );
    if (conflict.rows.length > 0) {
      return res.status(400).json({
        error: `Этот пользователь уже привязан к устройству ${conflict.rows[0].serial_number}`
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Обновляем поля устройства
    const updates = [];
    const values = [];
    let p = 1;
    if (serial_number !== undefined) { updates.push(`serial_number=$${p++}`); values.push(serial_number); }
    if (owner_id !== undefined) { updates.push(`owner_id=$${p++}`); values.push(owner_id || null); }
    if (is_active !== undefined) { updates.push(`is_active=$${p++}`); values.push(is_active); }
    if (fw_version !== undefined) { updates.push(`fw_version=$${p++}`); values.push(fw_version); }
    if (last_lat !== undefined) { updates.push(`last_lat=$${p++}`); values.push(last_lat); }
    if (last_lng !== undefined) { updates.push(`last_lng=$${p++}`); values.push(last_lng); }
    if (last_seen !== undefined) { updates.push(`last_seen=$${p++}`); values.push(last_seen); }
    updates.push(`updated_at=CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await client.query(
      `UPDATE devices SET ${updates.join(', ')} WHERE id=$${p} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Device not found' });
    }
    const device = result.rows[0];

    // Синхронизируем категории если переданы
    if (Array.isArray(category_ids)) {
      // Получаем текущие категории устройства
      const oldCats = await client.query(
        'SELECT category_id FROM device_categories WHERE device_id = $1',
        [id]
      );
      const oldIds = oldCats.rows.map(r => r.category_id);
      const newIds = category_ids.map(Number);

      const toAdd = newIds.filter(cid => !oldIds.includes(cid));
      const toRemove = oldIds.filter(cid => !newIds.includes(cid));

      // Добавляем новые категории
      for (const cid of toAdd) {
        await client.query(
          'INSERT INTO device_categories (device_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, cid]
        );
      }

      // Удаляем снятые категории
      for (const cid of toRemove) {
        await client.query(
          'DELETE FROM device_categories WHERE device_id = $1 AND category_id = $2',
          [id, cid]
        );
      }

      // Пересчитываем права привязанного пользователя
      const userId = owner_id !== undefined ? (owner_id || device.owner_id) : device.owner_id;
      if (userId) {
        // Удаляем права на снятые категории и их подкатегории
        for (const cid of toRemove) {
          const subCats = await client.query(
            'SELECT id FROM categories WHERE id = $1 OR parent_id = $1',
            [cid]
          );
          for (const cat of subCats.rows) {
            await client.query(
              'DELETE FROM user_category_permissions WHERE user_id = $1 AND category_id = $2',
              [userId, cat.id]
            );
          }
        }

        // Выдаём права на добавленные категории и их подкатегории
        for (const cid of toAdd) {
          const subCats = await client.query(
            'SELECT id FROM categories WHERE id = $1 OR parent_id = $1',
            [cid]
          );
          for (const cat of subCats.rows) {
            await client.query(
              'INSERT INTO user_category_permissions (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [userId, cat.id]
            );
          }
        }
      }
    } else if (owner_id && !Array.isArray(category_ids)) {
      // Если только владелец изменился — выдаём права на все текущие категории
      const curCats = await client.query(
        `SELECT dc.category_id FROM device_categories dc WHERE dc.device_id = $1`,
        [id]
      );
      for (const row of curCats.rows) {
        const subCats = await client.query(
          'SELECT id FROM categories WHERE id = $1 OR parent_id = $1',
          [row.category_id]
        );
        for (const cat of subCats.rows) {
          await client.query(
            'INSERT INTO user_category_permissions (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [owner_id, cat.id]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ device });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(400).json({ error: 'Серийный номер уже существует' });
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Удалить устройство
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM devices WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Device not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
