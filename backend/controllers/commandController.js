import pool from '../config/database.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Получить все команды
export const getAllCommands = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.email as creator_email
      FROM commands c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `);

    res.json({ commands: result.rows });
  } catch (error) {
    console.error('Get commands error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить активные команды (для обычных пользователей)
export const getActiveCommands = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, created_at
      FROM commands
      WHERE is_active = true
      ORDER BY name ASC
    `);

    res.json({ commands: result.rows });
  } catch (error) {
    console.error('Get active commands error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить команду по ID
export const getCommandById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM commands WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Command not found' });
    }

    res.json({ command: result.rows[0] });
  } catch (error) {
    console.error('Get command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Создать новую команду (только админ)
export const createCommand = async (req, res) => {
  const { name, description, command } = req.body;

  if (!name || !command) {
    return res.status(400).json({ error: 'Name and command are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO commands (name, description, command, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, command, req.user.id]
    );

    res.status(201).json({
      message: 'Command created successfully',
      command: result.rows[0]
    });
  } catch (error) {
    console.error('Create command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Обновить команду (только админ)
export const updateCommand = async (req, res) => {
  const { id } = req.params;
  const { name, description, command, is_active } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (command !== undefined) {
      updates.push(`command = $${paramCount}`);
      values.push(command);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE commands
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Command not found' });
    }

    res.json({
      message: 'Command updated successfully',
      command: result.rows[0]
    });
  } catch (error) {
    console.error('Update command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Удалить команду (только админ)
export const deleteCommand = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM commands WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Command not found' });
    }

    res.json({ message: 'Command deleted successfully' });
  } catch (error) {
    console.error('Delete command error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Выполнить команду
export const executeCommand = async (req, res) => {
  const { id } = req.params;

  try {
    // Получить команду
    const commandResult = await pool.query(
      'SELECT * FROM commands WHERE id = $1 AND is_active = true',
      [id]
    );

    if (commandResult.rows.length === 0) {
      return res.status(404).json({ error: 'Command not found or inactive' });
    }

    const command = commandResult.rows[0];

    // Выполнить команду
    let status = 'success';
    let output = '';
    let error = '';

    try {
      const { stdout, stderr } = await execPromise(command.command, {
        timeout: 30000, // 30 секунд таймаут
        maxBuffer: 1024 * 1024 // 1MB буфер
      });
      output = stdout;
      if (stderr) {
        error = stderr;
      }
    } catch (execError) {
      status = 'error';
      error = execError.message;
      output = execError.stdout || '';
    }

    // Сохранить лог выполнения
    const logResult = await pool.query(
      'INSERT INTO command_logs (command_id, user_id, status, output, error) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, req.user.id, status, output, error]
    );

    res.json({
      message: 'Command executed',
      log: logResult.rows[0],
      status,
      output,
      error
    });
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({ error: 'Server error during command execution' });
  }
};

// Получить логи выполнения команды
export const getCommandLogs = async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  try {
    const result = await pool.query(`
      SELECT cl.*, u.email as user_email, c.name as command_name
      FROM command_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      LEFT JOIN commands c ON cl.command_id = c.id
      WHERE cl.command_id = $1
      ORDER BY cl.executed_at DESC
      LIMIT $2
    `, [id, limit]);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get command logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить все логи (для админа)
export const getAllLogs = async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;

  try {
    const result = await pool.query(`
      SELECT cl.*, u.email as user_email, c.name as command_name
      FROM command_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      LEFT JOIN commands c ON cl.command_id = c.id
      ORDER BY cl.executed_at DESC
      LIMIT $1
    `, [limit]);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get all logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
