import pool from '../config/database.js';

// Получить все команды
export const getAllCommands = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.email as creator_email, cat.name as category_name
      FROM commands c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ORDER BY c.sort_order ASC, c.id ASC
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
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;
    let params;

    // Админы видят все команды
    if (userRole === 'admin') {
      query = `
        SELECT c.id, c.name, c.description, c.category_id, c.created_at,
               c.can_bus, c.can_id, c.d0, c.d1, c.d2, c.d3, c.d4, c.d5, c.d6, c.d7,
               c.sort_order,
               cat.name as category_name, cat.parent_id, cat.color as category_color,
               parent.name as parent_category_name, parent.color as parent_category_color
        FROM commands c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN categories parent ON cat.parent_id = parent.id
        WHERE c.is_active = true AND (cat.is_active = true OR cat.id IS NULL)
        ORDER BY c.sort_order ASC, c.id ASC
      `;
      params = [];
    } else {
      // Обычные пользователи видят только команды из разрешенных категорий
      query = `
        SELECT c.id, c.name, c.description, c.category_id, c.created_at,
               c.can_bus, c.can_id, c.d0, c.d1, c.d2, c.d3, c.d4, c.d5, c.d6, c.d7,
               c.sort_order,
               cat.name as category_name, cat.parent_id, cat.color as category_color,
               parent.name as parent_category_name, parent.color as parent_category_color
        FROM commands c
        LEFT JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN categories parent ON cat.parent_id = parent.id
        WHERE c.is_active = true
          AND c.category_id IS NOT NULL
          AND cat.is_active = true
          AND EXISTS (
            SELECT 1 FROM user_category_permissions ucp
            WHERE ucp.user_id = $1
              AND (ucp.category_id = c.category_id OR ucp.category_id = cat.parent_id)
          )
        ORDER BY c.sort_order ASC, c.id ASC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json({ commands: result.rows });
  } catch (error) {
    console.error('Get active commands error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

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
  const { name, description, category_id, can_bus, can_id, d0, d1, d2, d3, d4, d5, d6, d7 } = req.body;

  if (!name || !can_id || !can_bus) {
    return res.status(400).json({ error: 'Name, CAN bus and CAN ID are required' });
  }

  try {
    // Получить максимальный sort_order
    const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order), 0) as max FROM commands');
    const sortOrder = maxOrder.rows[0].max + 1;

    const result = await pool.query(
      'INSERT INTO commands (name, description, category_id, can_bus, can_id, d0, d1, d2, d3, d4, d5, d6, d7, sort_order, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
      [name, description, category_id || null, can_bus, can_id, d0, d1, d2, d3, d4, d5, d6, d7, sortOrder, req.user.id]
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
  const { name, description, category_id, can_bus, can_id, d0, d1, d2, d3, d4, d5, d6, d7, is_active } = req.body;

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

    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount}`);
      values.push(category_id || null);
      paramCount++;
    }

    if (can_bus !== undefined) {
      updates.push(`can_bus = $${paramCount}`);
      values.push(can_bus);
      paramCount++;
    }

    if (can_id !== undefined) {
      updates.push(`can_id = $${paramCount}`);
      values.push(can_id);
      paramCount++;
    }

    ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(req.body[field]);
        paramCount++;
      }
    });

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

// Обновить порядок команд
export const updateCommandsOrder = async (req, res) => {
  const { commands } = req.body;

  if (!Array.isArray(commands)) {
    return res.status(400).json({ error: 'Commands array is required' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < commands.length; i++) {
        await client.query(
          'UPDATE commands SET sort_order = $1 WHERE id = $2',
          [i, commands[i].id]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Order updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update order error:', error);
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
    const commandResult = await pool.query(
      'SELECT * FROM commands WHERE id = $1 AND is_active = true',
      [id]
    );

    if (commandResult.rows.length === 0) {
      return res.status(404).json({ error: 'Command not found or inactive' });
    }

    const command = commandResult.rows[0];

    // Формирование CAN команды
    const canCommand = `CAN${command.can_bus} ${command.can_id} ${command.d0 || '00'} ${command.d1 || '00'} ${command.d2 || '00'} ${command.d3 || '00'} ${command.d4 || '00'} ${command.d5 || '00'} ${command.d6 || '00'} ${command.d7 || '00'}`;

    const status = 'success';
    const output = `CAN Command: ${canCommand}`;
    const error = '';

    // TODO: Здесь будет отправка команды на STM32/SIM868E

    const logResult = await pool.query(
      'INSERT INTO command_logs (command_id, user_id, status, output, error) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, req.user.id, status, output, error]
    );

    res.json({
      message: 'Command executed',
      log: logResult.rows[0],
      status,
      output,
      error,
      canCommand
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
