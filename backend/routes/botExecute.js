import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Middleware — проверка секрета бота
router.use((req, res, next) => {
  if (req.headers['x-bot-secret'] !== process.env.BOT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// Выполнить команду (бот → устройство через Socket.io)
router.post('/commands/:id/execute', async (req, res) => {
  const { id } = req.params;
  const { device_serial, user_id } = req.body;
  const io = req.app.get('io');

  try {
    const cmdRes = await pool.query('SELECT * FROM commands WHERE id = $1 AND is_active = true', [id]);
    if (cmdRes.rows.length === 0) return res.status(404).json({ error: 'Команда не найдена' });

    const cmd = cmdRes.rows[0];

    // Отправляем на устройство через Socket.io
    io.emit(`cmd:execute:${device_serial}`, {
      command_id: cmd.id,
      can_bus: cmd.can_bus,
      can_id: cmd.can_id,
      data: [cmd.d0, cmd.d1, cmd.d2, cmd.d3, cmd.d4, cmd.d5, cmd.d6, cmd.d7]
    });

    res.json({ message: 'Команда отправлена', command: cmd.name });
  } catch (error) {
    console.error('Bot execute error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
