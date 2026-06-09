import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Получить полную информацию о пользователе (только для админа)
router.get('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Основная информация о пользователе
    const userResult = await pool.query(
      'SELECT id, email, role, phone, phone2, phone3, module_serial, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Логи выполнения команд
    const commandLogsResult = await pool.query(
      `SELECT cl.id, cl.status, cl.output, cl.error, cl.executed_at,
              c.name as command_name, c.description as command_description,
              cat.name as category_name, parent.name as parent_category_name
       FROM command_logs cl
       LEFT JOIN commands c ON cl.command_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN categories parent ON cat.parent_id = parent.id
       WHERE cl.user_id = $1
       ORDER BY cl.executed_at DESC
       LIMIT 100`,
      [userId]
    );

    // Логи авторизации
    const loginLogsResult = await pool.query(
      `SELECT id, ip_address, user_agent, status, created_at
       FROM login_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    // Статистика
    const statsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN cl.status = 'success' THEN cl.id END) as successful_commands,
        COUNT(DISTINCT CASE WHEN cl.status = 'error' THEN cl.id END) as failed_commands,
        COUNT(DISTINCT ll.id) as total_logins,
        COUNT(DISTINCT CASE WHEN ll.status = 'success' THEN ll.id END) as successful_logins,
        COUNT(DISTINCT CASE WHEN ll.status = 'failed' THEN ll.id END) as failed_logins
       FROM users u
       LEFT JOIN command_logs cl ON u.id = cl.user_id
       LEFT JOIN login_logs ll ON u.id = ll.user_id
       WHERE u.id = $1`,
      [userId]
    );

    // Устройство пользователя
    const deviceResult = await pool.query(
      `SELECT d.id, d.serial_number, d.is_active, d.last_seen, d.fw_version,
              d.last_lat, d.last_lng
       FROM devices d
       WHERE d.owner_id = $1`,
      [userId]
    );

    // Команды по категориям устройства (подкатегория → fallback на родительскую)
    const dev = deviceResult.rows[0];
    let commandGroups = [];
    if (dev) {
      const catResult = await pool.query(
        `SELECT dc.category_id,
                cat.name    AS cat_name,
                cat.parent_id,
                parent.name AS parent_name
         FROM device_categories dc
         JOIN categories cat    ON dc.category_id = cat.id
         LEFT JOIN categories parent ON cat.parent_id = parent.id
         WHERE dc.device_id = $1 AND cat.is_active = true`,
        [dev.id]
      );

      for (const row of catResult.rows) {
        const subCmds = await pool.query(
          `SELECT id, name, description
           FROM commands
           WHERE category_id = $1 AND is_active = true
           ORDER BY sort_order ASC, id ASC`,
          [row.category_id]
        );

        if (subCmds.rows.length > 0) {
          commandGroups.push({ label: row.cat_name, commands: subCmds.rows });
        } else if (row.parent_id) {
          const parentCmds = await pool.query(
            `SELECT id, name, description
             FROM commands
             WHERE category_id = $1 AND is_active = true
             ORDER BY sort_order ASC, id ASC`,
            [row.parent_id]
          );
          if (parentCmds.rows.length > 0) {
            commandGroups.push({ label: row.parent_name, commands: parentCmds.rows });
          }
        }
      }

      // Дедупликация по заголовку
      const seen = new Map();
      for (const g of commandGroups) {
        if (!seen.has(g.label)) seen.set(g.label, g);
      }
      commandGroups = [...seen.values()];
    }

    res.json({
      user,
      device: dev || null,
      commandGroups,
      commandLogs: commandLogsResult.rows,
      loginLogs: loginLogsResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get user card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить марку/модель устройства пользователя
router.put('/:userId/device', authenticateToken, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { category_id } = req.body;

  try {
    const deviceResult = await pool.query(
      'SELECT id FROM devices WHERE owner_id = $1',
      [userId]
    );
    if (deviceResult.rows.length === 0)
      return res.status(404).json({ error: 'Device not found' });

    await pool.query(
      'UPDATE devices SET category_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [category_id || null, deviceResult.rows[0].id]
    );

    res.json({ message: 'Настройки устройства обновлены' });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
