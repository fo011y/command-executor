import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const initDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('🔧 Initializing database...');

    // Создание таблицы пользователей
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "users" created');

    // Создание таблицы команд
    await client.query(`
      CREATE TABLE IF NOT EXISTS commands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        command TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "commands" created');

    // Создание таблицы логов выполнения команд
    await client.query(`
      CREATE TABLE IF NOT EXISTS command_logs (
        id SERIAL PRIMARY KEY,
        command_id INTEGER REFERENCES commands(id),
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) NOT NULL,
        output TEXT,
        error TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "command_logs" created');

    // Создание индексов
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_commands_active ON commands(is_active);
      CREATE INDEX IF NOT EXISTS idx_command_logs_command_id ON command_logs(command_id);
      CREATE INDEX IF NOT EXISTS idx_command_logs_user_id ON command_logs(user_id);
    `);
    console.log('✅ Indexes created');

    // Создание администратора по умолчанию
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await client.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        [adminEmail, hashedPassword, 'admin']
      );
      console.log(`✅ Admin user created: ${adminEmail}`);
      console.log(`⚠️  Default password: ${adminPassword}`);
      console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('✅ Database initialization completed!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initDatabase().catch(console.error);
