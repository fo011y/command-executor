import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { mailStatusChanged } from '../services/mailer.js';

// Получить всех пользователей (только для админа)
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить пользователя по ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, email, role, is_active, phone, phone2, phone3, module_serial, created_at FROM users WHERE id = $1',
      [id]
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

// Обновить пользователя
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, role, is_active, password, current_password, phone, phone2, phone3, module_serial } = req.body;

  try {
    // Проверка существования пользователя
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Если пользователь меняет свой пароль, проверяем текущий пароль
    if (password !== undefined && password.trim() !== '') {
      if (parseInt(id) === req.user.id) {
        // Пользователь меняет свой собственный пароль
        if (!current_password) {
          return res.status(400).json({ error: 'Current password is required' });
        }

        const isPasswordValid = await bcrypt.compare(current_password, existingUser.rows[0].password);
        if (!isPasswordValid) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
      }
    }

    // Подготовка данных для обновления
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (phone2 !== undefined) {
      updates.push(`phone2 = $${paramCount}`);
      values.push(phone2);
      paramCount++;
    }

    if (phone3 !== undefined) {
      updates.push(`phone3 = $${paramCount}`);
      values.push(phone3);
      paramCount++;
    }

    if (module_serial !== undefined) {
      updates.push(`module_serial = $${paramCount}`);
      values.push(module_serial);
      paramCount++;
    }

    if (password !== undefined && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, role, is_active, phone, phone2, phone3, module_serial, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    // Если изменился статус — уведомить пользователя
    if (is_active !== undefined && is_active !== existingUser.rows[0].is_active) {
      mailStatusChanged({ email: result.rows[0].email, is_active: result.rows[0].is_active }).catch(() => {});
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Удалить пользователя
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Проверка, что пользователь не удаляет сам себя
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Активировать/деактивировать пользователя
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, is_active',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    mailStatusChanged({ email: result.rows[0].email, is_active: result.rows[0].is_active }).catch(() => {});

    res.json({
      message: 'User status updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить права доступа пользователя к категориям
export const getUserPermissions = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT c.id, c.name, c.parent_id, p.name as parent_name
      FROM user_category_permissions ucp
      JOIN categories c ON ucp.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE ucp.user_id = $1
      ORDER BY p.name ASC NULLS FIRST, c.name ASC
    `, [id]);

    res.json({ permissions: result.rows });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Обновить права доступа пользователя
export const updateUserPermissions = async (req, res) => {
  const { id } = req.params;
  const { category_ids } = req.body;

  if (!Array.isArray(category_ids)) {
    return res.status(400).json({ error: 'category_ids must be an array' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Удалить все существующие права
      await client.query('DELETE FROM user_category_permissions WHERE user_id = $1', [id]);

      // Добавить новые права
      for (const categoryId of category_ids) {
        await client.query(
          'INSERT INTO user_category_permissions (user_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
