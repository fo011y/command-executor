import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ─── Пользовательские эндпоинты ─────────────────────────────────────────────

// GET /api/device-settings
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT d.id, d.serial_number, d.is_active, d.last_seen,
                    d.last_lat, d.last_lng, d.fw_version
             FROM devices d
             WHERE d.owner_id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: 'No device linked to this account' });

        const device = result.rows[0];

        // Все категории привязанные к устройству
        const catResult = await pool.query(
            `SELECT dc.category_id,
                    cat.name        AS cat_name,
                    cat.parent_id,
                    parent.name     AS parent_name
             FROM device_categories dc
             JOIN categories cat    ON dc.category_id = cat.id
             LEFT JOIN categories parent ON cat.parent_id = parent.id
             WHERE dc.device_id = $1 AND cat.is_active = true`,
            [device.id]
        );

        // Для каждой категории определяем: есть ли команды у самой подкатегории,
        // иначе берём команды родительской категории.
        // Заголовок = подкатегория (если есть parent) или категория.
        const groups = [];
        for (const row of catResult.rows) {
            const subCmds = await pool.query(
                `SELECT id, name, description
                 FROM commands
                 WHERE category_id = $1 AND is_active = true
                 ORDER BY sort_order ASC, id ASC`,
                [row.category_id]
            );

            if (subCmds.rows.length > 0) {
                // У подкатегории есть свои команды — показываем подкатегорию как заголовок
                groups.push({ label: row.cat_name, commands: subCmds.rows });
            } else if (row.parent_id) {
                // Подкатегория без команд — берём команды родительской категории
                const parentCmds = await pool.query(
                    `SELECT id, name, description
                     FROM commands
                     WHERE category_id = $1 AND is_active = true
                     ORDER BY sort_order ASC, id ASC`,
                    [row.parent_id]
                );
                if (parentCmds.rows.length > 0) {
                    groups.push({ label: row.parent_name, commands: parentCmds.rows });
                }
            }
        }

        // Дедупликация групп с одинаковым заголовком
        const seen = new Map();
        for (const g of groups) {
            if (!seen.has(g.label)) seen.set(g.label, g);
        }

        res.json({
            device: {
                id: device.id,
                serial_number: device.serial_number,
                is_active: device.is_active,
                last_seen: device.last_seen,
                last_lat: device.last_lat,
                last_lng: device.last_lng,
                fw_version: device.fw_version
            },
            command_groups: [...seen.values()]
        });
    } catch (error) {
        console.error('Get device settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Справочники: марки (категории верхнего уровня) ──────────────────────────

// GET /api/device-settings/brands  →  категории без parent_id
router.get('/brands', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name'
        );
        res.json({ brands: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/device-settings/models/:brandId  →  подкатегории выбранной марки
router.get('/models/:brandId', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name FROM categories WHERE parent_id = $1 ORDER BY name',
            [req.params.brandId]
        );
        res.json({ models: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Админ: управление командами ────────────────────────────────────────────

// GET /api/device-settings/admin/commands
router.get('/admin/commands', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM device_commands ORDER BY id');
        res.json({ commands: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/device-settings/admin/commands
router.post('/admin/commands', authenticateToken, requireAdmin, async (req, res) => {
    const { name, label, description, can_bus, can_id, can_ide, can_data, can_dlc } = req.body;
    if (!name || !label || !can_id || !can_data)
        return res.status(400).json({ error: 'name, label, can_id, can_data required' });
    try {
        const result = await pool.query(
            `INSERT INTO device_commands (name, label, description, can_bus, can_id, can_ide, can_data, can_dlc)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [name, label, description || null, can_bus || 1, can_id, can_ide || 0, can_data, can_dlc || 8]
        );
        res.status(201).json({ command: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'Команда с таким именем уже существует' });
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/device-settings/admin/commands/:id
router.delete('/admin/commands/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM device_commands WHERE id = $1', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/device-settings/commands/:commandId/execute
router.post('/commands/:commandId/execute', authenticateToken, async (req, res) => {
    try {
        const deviceResult = await pool.query(
            'SELECT id FROM devices WHERE owner_id = $1 AND is_active = true',
            [req.user.id]
        );
        if (deviceResult.rows.length === 0)
            return res.status(404).json({ error: 'No active device' });

        const deviceId = deviceResult.rows[0].id;

        const allowed = await pool.query(
            'SELECT 1 FROM device_allowed_commands WHERE device_id=$1 AND command_id=$2',
            [deviceId, req.params.commandId]
        );
        if (allowed.rows.length === 0)
            return res.status(403).json({ error: 'Command not allowed for this device' });

        await pool.query(
            'INSERT INTO device_command_queue (device_id, command_id, created_by) VALUES ($1,$2,$3)',
            [deviceId, req.params.commandId, req.user.id]
        );

        res.json({ message: 'Команда поставлена в очередь' });
    } catch (error) {
        console.error('Execute command error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
