import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from "express-validator";
import { mailNewRegistration, mailRegistrationPending } from "../services/mailer.js";

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, serial_number } = req.body;

  if (!serial_number) {
    return res.status(400).json({ error: 'Серийный номер обязателен' });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const deviceCheck = await pool.query(
      'SELECT id, owner_id, category_id FROM devices WHERE serial_number = $1',
      [serial_number]
    );

    if (deviceCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Устройство с таким серийным номером не найдено' });
    }

    if (deviceCheck.rows[0].owner_id !== null) {
      return res.status(400).json({ error: 'Это устройство уже зарегистрировано на другого пользователя' });
    }

    const deviceId = deviceCheck.rows[0].id;
    const deviceCategoryId = deviceCheck.rows[0].category_id;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, module_serial, is_active) VALUES ($1, $2, $3, $4) RETURNING id, email, role, is_active, created_at',
      [email, hashedPassword, serial_number, false]
    );

    const user = result.rows[0];

    await pool.query(
      'UPDATE devices SET owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [user.id, deviceId]
    );

    if (deviceCategoryId) {
      const cats = await pool.query(
        'SELECT id FROM categories WHERE id = $1 OR parent_id = $1',
        [deviceCategoryId]
      );
      for (const cat of cats.rows) {
        await pool.query(
          'INSERT INTO user_category_permissions (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, cat.id]
        );
      }
    }

    res.status(201).json({
      message: 'Регистрация прошла успешно. Ожидайте подтверждения от администратора.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      }
    });

    // Отправляем письма асинхронно, не блокируя ответ
    mailRegistrationPending({ email }).catch(() => {});
    mailNewRegistration({ email, serial: serial_number }).catch(() => {});
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const ip_address = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const user_agent = req.headers['user-agent'] || '';

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      // Записываем неудачную попытку (пользователь не найден)
      await pool.query(
        'INSERT INTO login_logs (user_id, ip_address, user_agent, status) VALUES (NULL, $1, $2, $3)',
        [ip_address, user_agent, 'failed']
      ).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await pool.query(
        'INSERT INTO login_logs (user_id, ip_address, user_agent, status) VALUES ($1, $2, $3, $4)',
        [user.id, ip_address, user_agent, 'failed']
      ).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      await pool.query(
        'INSERT INTO login_logs (user_id, ip_address, user_agent, status) VALUES ($1, $2, $3, $4)',
        [user.id, ip_address, user_agent, 'failed']
      ).catch(() => {});
      return res.status(403).json({
        error: 'Account is not active. Please wait for admin approval.',
        is_active: false
      });
    }

    // Успешный вход
    await pool.query(
      'INSERT INTO login_logs (user_id, ip_address, user_agent, status) VALUES ($1, $2, $3, $4)',
      [user.id, ip_address, user_agent, 'success']
    ).catch(() => {});

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_active: user.is_active },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role: user.role, is_active: user.is_active }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
