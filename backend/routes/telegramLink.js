import express from 'express';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Сгенерировать код привязки (для авторизованного пользователя)
router.post('/generate-code', authenticateToken, async (req, res) => {
  try {
    // Удаляем старые коды
    await pool.query('DELETE FROM telegram_link_codes WHERE user_id = $1', [req.user.id]);

    const code = crypto.randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO telegram_link_codes (user_id, code, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [req.user.id, code]
    );

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    res.json({
      code,
      command: `/start ${code}`,
      bot_url: `https://t.me/${botUsername}?start=${code}`,
      expires_in: 900
    });
  } catch (error) {
    console.error('Generate telegram code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Проверить статус привязки
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT telegram_id, telegram_username, telegram_first_name, linked_at FROM telegram_links WHERE user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.json({ linked: false });
    }
    res.json({ linked: true, ...result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Отвязать Telegram
router.delete('/unlink', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM telegram_links WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Telegram отвязан' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
