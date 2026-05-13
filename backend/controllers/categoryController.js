import pool from '../config/database.js';

// Получить все категории с иерархией
export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
             p.name as parent_name,
             (SELECT COUNT(*) FROM commands WHERE category_id = c.id) as commands_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.parent_id NULLS FIRST, c.name ASC
    `);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить активные категории (для пользователей)
export const getActiveCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.is_active = true
      ORDER BY c.parent_id NULLS FIRST, c.name ASC
    `);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get active categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Получить категорию по ID
export const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Создать категорию
export const createCategory = async (req, res) => {
  const { name, parent_id, description, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (name, parent_id, description, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, parent_id || null, description, color || '#8b5cf6']
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, description, is_active } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (parent_id !== undefined) {
      updates.push(`parent_id = $${paramCount}`);
      values.push(parent_id || null);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
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
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Удалить категорию
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Проверить, есть ли команды в этой категории
    const commandsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM commands WHERE category_id = $1',
      [id]
    );

    if (parseInt(commandsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete category with commands. Move or delete commands first.'
      });
    }

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
