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

    res.json({
      user,
      commandLogs: commandLogsResult.rows,
      loginLogs: loginLogsResult.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Get user card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
