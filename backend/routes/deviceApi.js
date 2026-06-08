import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Middleware: авторизация устройства по device_token из заголовка X-Device-Token
const authenticateDevice = async (req, res, next) => {
    const token = req.headers['x-device-token'];
    if (!token) return res.status(401).json({ error: 'X-Device-Token required' });

    const result = await pool.query(
        `SELECT d.id, d.serial_number, d.is_active, d.owner_id, d.category_id
         FROM devices d WHERE d.device_token = $1`,
        [token]
    ).catch(() => null);

    if (!result || result.rows.length === 0)
        return res.status(403).json({ error: 'Invalid device token' });

    if (!result.rows[0].is_active)
        return res.status(403).json({ error: 'Device is inactive' });

    req.device = result.rows[0];
    next();
};

// POST /api/device/ping
// Устройство стучится при старте с серийным номером.
// Если привязано к аккаунту и активно — возвращает device_token.
// Если не привязано — возвращает status: "pending".
router.post('/ping', async (req, res) => {
    const { serial_number, fw_version } = req.body;
    if (!serial_number) return res.status(400).json({ error: 'serial_number required' });

    try {
        const result = await pool.query(
            `SELECT id, device_token, is_active, owner_id, fw_version
             FROM devices WHERE serial_number = $1`,
            [serial_number]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Device not found' });

        const device = result.rows[0];

        // Обновить версию прошивки и last_seen
        await pool.query(
            `UPDATE devices SET last_seen = CURRENT_TIMESTAMP,
             fw_version = COALESCE($1, fw_version), updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [fw_version || null, device.id]
        );

        if (!device.owner_id) {
            return res.json({ status: 'pending', message: 'Device not linked to any account' });
        }

        if (!device.is_active) {
            return res.json({ status: 'inactive', message: 'Device is inactive' });
        }

        return res.json({
            status: 'ok',
            device_token: device.device_token
        });
    } catch (error) {
        console.error('Device ping error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/device/settings
// Устройство получает все необходимые настройки: телефоны владельца,
// марку/модель авто, список доступных команд.
router.get('/settings', authenticateDevice, async (req, res) => {
    const deviceId = req.device.id;

    try {
        // Телефоны владельца
        const ownerResult = await pool.query(
            `SELECT phone, phone2, phone3 FROM users WHERE id = $1`,
            [req.device.owner_id]
        );
        const owner = ownerResult.rows[0] || {};

        // Марка (родительская категория) и модель (подкатегория = category_id устройства)
        let car = { brand: null, model: null };
        if (req.device.category_id) {
            const carResult = await pool.query(
                `SELECT model.name as model, brand.name as brand
                 FROM categories model
                 LEFT JOIN categories brand ON model.parent_id = brand.id
                 WHERE model.id = $1`,
                [req.device.category_id]
            );
            if (carResult.rows.length > 0) car = carResult.rows[0];
        }

        // Команды: из подкатегории устройства, если нет — из родительской категории
        const cmdResult = await pool.query(
            `WITH eff AS (
               SELECT CASE
                 WHEN EXISTS(SELECT 1 FROM commands WHERE category_id = $1 AND is_active = true)
                   THEN $1::int
                 ELSE (SELECT parent_id FROM categories WHERE id = $1)
               END AS cat_id
             )
             SELECT c.name, c.label, c.can_bus, c.can_id,
                    c.can_ide, c.can_data, c.can_dlc
             FROM commands c, eff
             WHERE c.category_id = eff.cat_id AND c.is_active = true
             ORDER BY c.id`,
            [req.device.category_id]
        );

        res.json({
            phones: {
                phone1: owner.phone || null,
                phone2: owner.phone2 || null,
                phone3: owner.phone3 || null
            },
            car: {
                brand: car.brand,
                model: car.model
            },
            commands: (req.device.category_id ? cmdResult.rows : []).map(cmd => ({
                name: cmd.name,
                label: cmd.label,
                can_bus: cmd.can_bus,
                can_id: cmd.can_id,
                can_ide: cmd.can_ide,
                can_data: cmd.can_data,
                can_dlc: cmd.can_dlc
            }))
        });
    } catch (error) {
        console.error('Device settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/device/telemetry
// Устройство отправляет GPS координаты и статус.
router.post('/telemetry', authenticateDevice, async (req, res) => {
    const { lat, lon, speed, fix, sat } = req.body;

    try {
        const updates = ['last_seen = CURRENT_TIMESTAMP', 'updated_at = CURRENT_TIMESTAMP'];
        const values = [];
        let p = 1;

        if (lat != null && lon != null) {
            updates.push(`last_lat = $${p++}`, `last_lng = $${p++}`);
            values.push(lat, lon);
        }

        values.push(req.device.id);
        await pool.query(
            `UPDATE devices SET ${updates.join(', ')} WHERE id = $${p}`,
            values
        );

        res.json({ ok: true });
    } catch (error) {
        console.error('Telemetry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/device/commands/poll
// Устройство опрашивает очередь команд на выполнение.
// Возвращает первую pending-команду и помечает её как sent.
router.post('/commands/poll', authenticateDevice, async (req, res) => {
    const deviceId = req.device.id;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `SELECT q.id, dc.name, dc.can_bus, dc.can_id, dc.can_ide, dc.can_data, dc.can_dlc
             FROM device_command_queue q
             JOIN device_commands dc ON q.command_id = dc.id
             WHERE q.device_id = $1 AND q.status = 'pending'
             ORDER BY q.created_at ASC
             LIMIT 1
             FOR UPDATE SKIP LOCKED`,
            [deviceId]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.json({ cmd: null });
        }

        const job = result.rows[0];
        await client.query(
            `UPDATE device_command_queue SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [job.id]
        );

        await client.query('COMMIT');

        res.json({
            cmd: {
                queue_id: job.id,
                name: job.name,
                can_bus: job.can_bus,
                can_id: job.can_id,
                can_ide: job.can_ide,
                can_data: job.can_data,
                can_dlc: job.can_dlc
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Command poll error:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// POST /api/device/commands/ack
// Устройство подтверждает выполнение команды.
router.post('/commands/ack', authenticateDevice, async (req, res) => {
    const { queue_id, success } = req.body;
    if (!queue_id) return res.status(400).json({ error: 'queue_id required' });

    try {
        await pool.query(
            `UPDATE device_command_queue
             SET status = $1, done_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND device_id = $3`,
            [success ? 'done' : 'error', queue_id, req.device.id]
        );
        res.json({ ok: true });
    } catch (error) {
        console.error('Command ack error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
