import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { sendMail } from '../services/mailer.js';

const router = express.Router();
router.use(authenticateToken, requireAdmin);

// Получить настройки
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM email_settings WHERE id = 1');
    const s = result.rows[0];
    // Не отдаём пароль в открытом виде
    res.json({ settings: { ...s, smtp_password: s.smtp_password ? '••••••••' : '' } });
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Сохранить настройки
router.put('/', async (req, res) => {
  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_name, admin_email, enabled } = req.body;
  try {
    const updates = [];
    const values = [];
    let p = 1;
    if (smtp_host !== undefined) { updates.push(`smtp_host=$${p++}`); values.push(smtp_host); }
    if (smtp_port !== undefined) { updates.push(`smtp_port=$${p++}`); values.push(Number(smtp_port)); }
    if (smtp_secure !== undefined) { updates.push(`smtp_secure=$${p++}`); values.push(smtp_secure); }
    if (smtp_user !== undefined) { updates.push(`smtp_user=$${p++}`); values.push(smtp_user); }
    if (smtp_password !== undefined && smtp_password !== '••••••••' && smtp_password !== '') {
      updates.push(`smtp_password=$${p++}`); values.push(smtp_password);
    }
    if (from_name !== undefined) { updates.push(`from_name=$${p++}`); values.push(from_name); }
    if (admin_email !== undefined) { updates.push(`admin_email=$${p++}`); values.push(admin_email); }
    if (enabled !== undefined) { updates.push(`enabled=$${p++}`); values.push(enabled); }
    updates.push(`updated_at=CURRENT_TIMESTAMP`);

    await pool.query(`UPDATE email_settings SET ${updates.join(', ')} WHERE id=1`, values);
    res.json({ message: 'Настройки сохранены' });
  } catch (error) {
    console.error('Save email settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Тестовая отправка
router.post('/test', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Укажите email получателя' });
  try {
    await sendMail({
      to,
      subject: 'GCBox Connect — тестовое письмо',
      html: '<h2>Тест отправки почты</h2><p>Если вы получили это письмо — настройки почты работают корректно.</p>'
    });
    res.json({ message: 'Письмо отправлено' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
