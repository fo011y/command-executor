# Command Executor - Backend

Backend для системы выполнения команд с real-time мониторингом и админ-панелью.

## Технологии

- **Node.js** + **Express** - REST API
- **Socket.io** - Real-time коммуникация
- **PostgreSQL** - База данных
- **JWT** - Аутентификация
- **bcryptjs** - Хеширование паролей

## Структура проекта

```
backend/
├── config/
│   └── database.js          # Конфигурация PostgreSQL
├── controllers/
│   ├── authController.js    # Регистрация, вход
│   ├── userController.js    # Управление пользователями
│   └── commandController.js # Управление и выполнение команд
├── middleware/
│   └── auth.js              # JWT аутентификация
├── routes/
│   ├── auth.js              # Маршруты аутентификации
│   ├── users.js             # Маршруты пользователей
│   └── commands.js          # Маршруты команд
├── scripts/
│   └── initDb.js            # Инициализация БД
├── .env.example             # Пример переменных окружения
├── server.js                # Главный файл сервера
└── package.json

```

## Установка

### 1. Установите PostgreSQL

**Ubuntu:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Создайте базу данных

```bash
sudo -u postgres psql
```

В psql выполните:
```sql
CREATE DATABASE command_executor;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE command_executor TO your_user;
\q
```

### 3. Установите зависимости

```bash
cd backend
npm install
```

### 4. Настройте переменные окружения

Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

Отредактируйте `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=command_executor
DB_USER=your_user
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 5. Инициализируйте базу данных

```bash
npm run init-db
```

Это создаст таблицы и администратора по умолчанию.

## Запуск

### Режим разработки (с автоперезагрузкой)
```bash
npm run dev
```

### Продакшн режим
```bash
npm start
```

Сервер запустится на `http://localhost:5000`

## API Endpoints

### Аутентификация

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**GET** `/api/auth/me`
- Требует: `Authorization: Bearer <token>`

### Пользователи (только админ)

**GET** `/api/users` - Получить всех пользователей

**GET** `/api/users/:id` - Получить пользователя по ID

**PUT** `/api/users/:id` - Обновить пользователя
```json
{
  "email": "newemail@example.com",
  "role": "admin",
  "is_active": true,
  "password": "newpassword"
}
```

**DELETE** `/api/users/:id` - Удалить пользователя

**PATCH** `/api/users/:id/toggle-status` - Активировать/деактивировать

### Команды

**GET** `/api/commands/active` - Получить активные команды (все пользователи)

**GET** `/api/commands` - Получить все команды (только админ)

**GET** `/api/commands/:id` - Получить команду по ID (только админ)

**POST** `/api/commands` - Создать команду (только админ)
```json
{
  "name": "Проверка диска",
  "description": "Проверяет свободное место на диске",
  "command": "df -h"
}
```

**PUT** `/api/commands/:id` - Обновить команду (только админ)

**DELETE** `/api/commands/:id` - Удалить команду (только админ)

**POST** `/api/commands/:id/execute` - Выполнить команду

**GET** `/api/commands/:id/logs` - Получить логи команды

**GET** `/api/commands/logs/all` - Получить все логи (только админ)

## WebSocket Events

### Клиент → Сервер

**`command:execute`**
```json
{
  "commandId": 1
}
```

**`command:completed`**
```json
{
  "commandId": 1,
  "status": "success",
  "output": "результат",
  "error": ""
}
```

### Сервер → Клиент

**`connected`** - Подключение установлено

**`command:started`** - Команда начала выполняться

**`command:result`** - Результат выполнения команды

**`command:execution`** - Уведомление админам о выполнении (только админы)

**`command:log`** - Новый лог выполнения (только админы)

## Структура базы данных

### Таблица `users`
```sql
id SERIAL PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL
role VARCHAR(50) DEFAULT 'user'
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Таблица `commands`
```sql
id SERIAL PRIMARY KEY
name VARCHAR(255) NOT NULL
description TEXT
command TEXT NOT NULL
is_active BOOLEAN DEFAULT true
created_by INTEGER REFERENCES users(id)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Таблица `command_logs`
```sql
id SERIAL PRIMARY KEY
command_id INTEGER REFERENCES commands(id)
user_id INTEGER REFERENCES users(id)
status VARCHAR(50) NOT NULL
output TEXT
error TEXT
executed_at TIMESTAMP
```

## Безопасность

- Пароли хешируются с помощью bcrypt
- JWT токены для аутентификации
- Новые пользователи неактивны по умолчанию (требуют одобрения админа)
- Команды выполняются с таймаутом 30 секунд
- CORS настроен для frontend

## Интеграция с STM32/SIM868E

Для будущей интеграции с модулем STM32 и модемом SIM868E:

1. Модуль может отправлять HTTP запросы к API
2. Использовать WebSocket для real-time команд
3. Создать специальный endpoint для устройств
4. Добавить таблицу `devices` для регистрации устройств

Пример:
```javascript
// POST /api/devices/command
{
  "device_id": "STM32_001",
  "command_id": 1,
  "token": "device_token"
}
```

## Разработка

### Добавление новой команды через API

```bash
curl -X POST http://localhost:5000/api/commands \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Перезагрузка",
    "description": "Перезагружает систему",
    "command": "sudo reboot"
  }'
```

### Тестирование WebSocket

Используйте Socket.io клиент:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.emit('command:execute', { commandId: 1 });
```

## Troubleshooting

### Ошибка подключения к PostgreSQL

Проверьте, что PostgreSQL запущен:
```bash
sudo systemctl status postgresql
```

Проверьте настройки в `.env`

### JWT ошибки

Убедитесь, что `JWT_SECRET` установлен в `.env`

### Команды не выполняются

Проверьте права доступа к командам в системе. Некоторые команды требуют `sudo`.

## Лицензия

MIT
