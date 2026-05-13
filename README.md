# Command Executor

Веб-приложение для удаленного выполнения команд с real-time мониторингом и админ-панелью.

## Возможности

✅ **Аутентификация через email** с JWT токенами  
✅ **Управление пользователями** - админ может активировать/деактивировать пользователей  
✅ **Настраиваемые команды** - админ создает команды через веб-интерфейс  
✅ **Real-time обновления** - WebSocket для мгновенных уведомлений  
✅ **Логирование** - все выполнения команд сохраняются в БД  
✅ **Админ-панель** - управление пользователями, командами и просмотр логов  
✅ **Готово к интеграции** с STM32 и SIM868E модемом  

## Технологии

### Backend
- **Node.js** + **Express** - REST API
- **Socket.io** - Real-time коммуникация
- **PostgreSQL** - База данных
- **JWT** - Аутентификация
- **bcryptjs** - Хеширование паролей

### Frontend
- **React 18** - UI библиотека
- **Vite** - Сборщик
- **React Router** - Маршрутизация
- **Socket.io-client** - WebSocket клиент
- **Axios** - HTTP клиент

## Структура проекта

```
command-executor/
├── backend/                 # Backend сервер
│   ├── config/             # Конфигурация БД
│   ├── controllers/        # Контроллеры (auth, users, commands)
│   ├── middleware/         # Middleware (аутентификация)
│   ├── routes/             # API маршруты
│   ├── scripts/            # Скрипты (инициализация БД)
│   ├── .env.example        # Пример переменных окружения
│   ├── server.js           # Главный файл сервера
│   └── package.json
│
└── frontend/               # Frontend приложение
    ├── src/
    │   ├── api/           # API клиент и WebSocket
    │   ├── components/    # React компоненты
    │   ├── context/       # React контексты (Auth)
    │   ├── App.jsx        # Главный компонент
    │   └── main.jsx       # Точка входа
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Быстрый старт

### Требования

- **Node.js** 18+ 
- **PostgreSQL** 12+
- **npm** или **yarn**

### 1. Установка PostgreSQL (Ubuntu)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Создайте базу данных:

```bash
sudo -u postgres psql
```

В psql:

```sql
CREATE DATABASE command_executor;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE command_executor TO your_user;
\q
```

### 2. Установка Backend

```bash
cd command-executor/backend
npm install
```

Создайте `.env` файл:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=command_executor
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key_change_this
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

Инициализируйте базу данных:

```bash
npm run init-db
```

Запустите сервер:

```bash
npm run dev
```

Backend запустится на `http://localhost:5000`

### 3. Установка Frontend

```bash
cd command-executor/frontend
npm install
```

Создайте `.env` файл:

```bash
cp .env.example .env
```

Запустите frontend:

```bash
npm run dev
```

Frontend запустится на `http://localhost:3000`

## Использование

### Первый вход

1. Откройте `http://localhost:3000`
2. Войдите как администратор:
   - Email: `admin@example.com`
   - Пароль: `admin123`
3. **Сразу смените пароль!**

### Регистрация пользователей

1. Новый пользователь регистрируется через `/register`
2. По умолчанию аккаунт **неактивен**
3. Администратор активирует пользователя в админ-панели

### Создание команд (админ)

1. Перейдите в админ-панель (`/admin`)
2. Вкладка "Команды" → "Добавить команду"
3. Заполните:
   - **Название**: Проверка диска
   - **Описание**: Показывает свободное место
   - **Команда**: `df -h`
   - **Активна**: ✓

### Выполнение команд (пользователь)

1. Войдите как пользователь
2. На главной странице отображаются доступные команды
3. Нажмите "Выполнить"
4. Результат отобразится в real-time

### Просмотр логов (админ)

1. Админ-панель → вкладка "Логи"
2. Все выполнения команд с результатами
3. Real-time обновления при новых выполнениях

## API Endpoints

### Аутентификация

```
POST /api/auth/register    - Регистрация
POST /api/auth/login       - Вход
GET  /api/auth/me          - Текущий пользователь
```

### Пользователи (только админ)

```
GET    /api/users          - Все пользователи
GET    /api/users/:id      - Пользователь по ID
PUT    /api/users/:id      - Обновить пользователя
DELETE /api/users/:id      - Удалить пользователя
PATCH  /api/users/:id/toggle-status - Изменить статус
```

### Команды

```
GET  /api/commands/active     - Активные команды (все)
GET  /api/commands            - Все команды (админ)
POST /api/commands            - Создать команду (админ)
PUT  /api/commands/:id        - Обновить команду (админ)
DELETE /api/commands/:id      - Удалить команду (админ)
POST /api/commands/:id/execute - Выполнить команду
GET  /api/commands/:id/logs   - Логи команды
GET  /api/commands/logs/all   - Все логи (админ)
```

## WebSocket Events

### Клиент → Сервер

- `command:execute` - Начало выполнения команды
- `command:completed` - Завершение выполнения

### Сервер → Клиент

- `connected` - Подключение установлено
- `command:started` - Команда начала выполняться
- `command:result` - Результат выполнения
- `command:execution` - Уведомление админам (только админы)
- `command:log` - Новый лог (только админы)

## Интеграция с STM32/SIM868E

Приложение готово к интеграции с модулем STM32 и модемом SIM868E.

### Вариант 1: HTTP API

Модуль отправляет HTTP запросы:

```c
// Пример для STM32
POST http://your-server:5000/api/auth/login
{
  "email": "device@example.com",
  "password": "device_password"
}

// Получить токен, затем:
POST http://your-server:5000/api/commands/1/execute
Authorization: Bearer <token>
```

### Вариант 2: WebSocket

Подключение через Socket.io:

```c
// Подключение с токеном
ws://your-server:5000?token=<jwt_token>

// Отправка команды
emit("command:execute", {"commandId": 1})

// Получение результата
on("command:result", callback)
```

### Рекомендации

1. Создайте отдельного пользователя для устройства
2. Используйте HTTPS в продакшене
3. Храните токен в энергонезависимой памяти STM32
4. Реализуйте переподключение при обрыве связи

## Деплой на сервер Ubuntu

### 1. Установите зависимости

```bash
sudo apt update
sudo apt install nodejs npm postgresql nginx
```

### 2. Настройте PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE command_executor;
CREATE USER prod_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE command_executor TO prod_user;
\q
```

### 3. Клонируйте проект

```bash
cd /var/www
git clone <your-repo> command-executor
cd command-executor
```

### 4. Настройте Backend

```bash
cd backend
npm install --production
cp .env.example .env
nano .env  # Отредактируйте настройки
npm run init-db
```

### 5. Соберите Frontend

```bash
cd ../frontend
npm install
npm run build
```

### 6. Настройте Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/command-executor/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### 7. Запустите Backend с PM2

```bash
npm install -g pm2
cd /var/www/command-executor/backend
pm2 start server.js --name command-executor
pm2 startup
pm2 save
```

### 8. Настройте SSL (опционально)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Безопасность

- ✅ Пароли хешируются с bcrypt
- ✅ JWT токены для аутентификации
- ✅ Новые пользователи неактивны по умолчанию
- ✅ Команды выполняются с таймаутом
- ✅ CORS настроен
- ⚠️ Используйте HTTPS в продакшене
- ⚠️ Смените JWT_SECRET
- ⚠️ Смените пароль администратора

## Troubleshooting

### Backend не запускается

Проверьте PostgreSQL:
```bash
sudo systemctl status postgresql
```

Проверьте `.env` файл

### Frontend не подключается к Backend

Проверьте `.env` в frontend:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

### WebSocket не работает

Проверьте CORS настройки в `server.js`

### Команды не выполняются

Проверьте права доступа к командам. Некоторые требуют `sudo`.

## Лицензия

MIT

## Поддержка

Если возникли вопросы, создайте issue в репозитории.
