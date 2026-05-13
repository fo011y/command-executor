import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Валидация телефона в формате +7 123 456 78 90
const validatePhone = (phone) => {
  const phoneRegex = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;
  return phoneRegex.test(phone);
};

// Валидация телефона в формате +375 11 222 33 44
const validatePhone3 = (phone) => {
  const phoneRegex = /^\+375 \d{2} \d{3} \d{2} \d{2}$/;
  return phoneRegex.test(phone);
};

// Валидация серийного номера в формате GCB-123456789
const validateSerial = (serial) => {
  const serialRegex = /^GCB-\d{9}$/;
  return serialRegex.test(serial);
};

// Получить профиль текущего пользователя
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, phone, phone2, phone3, module_serial, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновить профиль текущего пользователя
router.put(
  '/me',
  authenticateToken,
  [
    body('phone').notEmpty().withMessage('Номер телефона обязателен'),
    body('phone2').optional(),
    body('phone3').optional(),
    body('module_serial').notEmpty().withMessage('Серийный номер обязателен')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, phone2, phone3, module_serial, current_password, password } = req.body;

    // Валидация формата телефона
    if (!validatePhone(phone)) {
      return res.status(400).json({
        error: 'Неверный формат номера телефона. Используйте формат: +7 123 456 78 90'
      });
    }

    // Валидация формата второго телефона (если указан)
    if (phone2 && phone2.trim() !== '' && !validatePhone(phone2)) {
      return res.status(400).json({
        error: 'Неверный формат второго номера телефона. Используйте формат: +7 123 456 78 90'
      });
    }

    // Валидация формата третьего телефона (если указан)
    if (phone3 && phone3.trim() !== '' && !validatePhone3(phone3)) {
      return res.status(400).json({
        error: 'Неверный формат третьего номера телефона. Используйте формат: +375 11 222 33 44'
      });
    }

    // Валидация формата серийного номера
    if (!validateSerial(module_serial)) {
      return res.status(400).json({
        error: 'Неверный формат серийного номера. Используйте формат: GCB-123456789'
      });
    }

    try {
      // Если пользователь хочет изменить пароль
      if (password) {
        if (!current_password) {
          return res.status(400).json({ error: 'Введите текущий пароль' });
        }

        // Проверяем текущий пароль
        const userResult = await pool.query(
          'SELECT password FROM users WHERE id = $1',
          [req.user.id]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(
          current_password,
          userResult.rows[0].password
        );

        if (!isValidPassword) {
          return res.status(400).json({ error: 'Неверный текущий пароль' });
        }

        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Обновляем профиль с новым паролем
        const result = await pool.query(
          'UPDATE users SET phone = $1, phone2 = $2, phone3 = $3, module_serial = $4, password = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING id, email, role, phone, phone2, phone3, module_serial',
          [phone, phone2 || null, phone3 || null, module_serial, hashedPassword, req.user.id]
        );

        res.json({
          message: 'Профиль и пароль успешно обновлены',
          user: result.rows[0]
        });
      } else {
        // Обновляем только профиль без пароля
        const result = await pool.query(
          'UPDATE users SET phone = $1, phone2 = $2, phone3 = $3, module_serial = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, role, phone, phone2, phone3, module_serial',
          [phone, phone2 || null, phone3 || null, module_serial, req.user.id]
        );

        res.json({
          message: 'Профиль успешно обновлен',
          user: result.rows[0]
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
