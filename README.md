# Command Executor — GCBox Connect

Веб-платформа для удалённого управления устройствами GSbox в реальном времени. Администраторы создают команды и категории, пользователи отправляют их на своё устройство через браузер или Telegram-бота. Все выполнения логируются с результатами.

---

## Возможности

✅ **Аутентификация через email** — JWT-токены, новые аккаунты неактивны до подтверждения админом  
✅ **Управление пользователями** — активация/деактивация, роли (user/admin)  
✅ **Команды и категории** — иерархическая структура, сортировка, активация/деактивация  
✅ **Real-time обновления** — WebSocket (Socket.io) для мгновенного получения результатов  
✅ **Логирование** — вся история выполнений с результатами в PostgreSQL  
✅ **Управление устройствами** — серийный номер, версия ПО, GPS, последняя активность  
✅ **Управление прошивками** — загрузка и хранение версий ПО  
✅ **Привязка Telegram** — одноразовый код для подключения Telegram-бота  
✅ **Интеграция со STM32** — HTTP API и WebSocket для устройств на SIM868  

---

## Технологии

### Backend
- **Node.js** + **Express** — REST API, порт 5000
- **Socket.io** — Real-time коммуникация
- **PostgreSQL** — база данных
- **JWT** — аутентификация
- **bcryptjs** — хеширование паролей

### Frontend
- **React 18** — UI
- **Vite** — сборщик
- **React Router** — маршрутизация
- **Socket.io-client** — WebSocket клиент
- **Axios** — HTTP клиент

---

## Структура проекта

```
command-executor/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usersController.js
│   │   ├── commandsController.js
│   │   ├── categoriesController.js
│   │   ├── devicesController.js
│   │   └── firmwareController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   └── index.js
│   ├── scripts/
│   │   └── init-db.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── api.js
    │   ├── components/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## API Endpoints

### Аутентификация

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |

### Пользователи (только админ)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/users` | Все пользователи |
| GET | `/api/users/:id` | Пользователь по ID |
| PUT | `/api/users/:id` | Обновить пользователя |
| DELETE | `/api/users/:id` | Удалить пользователя |
| PATCH | `/api/users/:id/toggle-status` | Изменить статус |

### Команды

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/commands/active` | Активные команды |
| GET | `/api/commands` | Все команды (админ) |
| POST | `/api/commands` | Создать команду (админ) |
| PUT | `/api/commands/:id` | Обновить команду (админ) |
| DELETE | `/api/commands/:id` | Удалить команду (админ) |
| POST | `/api/commands/:id/execute` | Выполнить команду |
| GET | `/api/commands/:id/logs` | Логи команды |
| GET | `/api/commands/logs/all` | Все логи (админ) |

---

## WebSocket события

### Клиент → Сервер
- `command:execute` — начало выполнения команды
- `command:completed` — завершение выполнения

### Сервер → Клиент
- `connected` — подключение установлено
- `command:started` — команда начала выполняться
- `command:result` — результат выполнения
- `command:execution` — уведомление для администраторов
- `command:log` — новый лог (только для админов)

---

## Быстрый старт

### Требования

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm**

### 1. Клонировать и установить зависимости

```bash
git clone https://github.com/fo011y/command-executor.git
cd command-executor

cd backend && npm install
cd ../frontend && npm install
```

### 2. Настроить переменные окружения

```bash
cd backend
cp .env.example .env
```

`.env`:

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

### 3. Инициализировать базу данных

```bash
cd backend
npm run init-db
```

### 4. Запустить

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Первый вход: `admin@example.com` / `admin123` — **сразу смените пароль**

---

## Деплой на сервер (Ubuntu + Nginx + PM2)

### 1. Backend

```bash
cd /opt/command-executor/backend
npm install --production
cp .env.example .env && nano .env
npm run init-db
pm2 start server.js --name command-executor
pm2 save && pm2 startup
```

### 2. Frontend

```bash
cd /opt/command-executor/frontend
npm install
npm run build
```

### 3. Nginx

```nginx
server {
    listen 80;
    server_name connect.gsmcanbox.ru;

    location / {
        root /opt/command-executor/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## Интеграция с устройством (STM32 + SIM868)

### HTTP API

```c
// Логин
POST http://connect.gsmcanbox.ru/api/auth/login
{"email": "device@example.com", "password": "device_password"}

// Выполнить команду (с токеном)
POST http://connect.gsmcanbox.ru/api/commands/1/execute
Authorization: Bearer <jwt_token>
```

### WebSocket

```c
// Подключение
ws://connect.gsmcanbox.ru?token=<jwt_token>

// Отправить команду
emit("command:execute", {"commandId": 1})

// Получить результат
on("command:result", callback)
```

---

## Безопасность

- ✅ Пароли хешируются с bcrypt
- ✅ JWT-токены для аутентификации
- ✅ Новые пользователи неактивны по умолчанию
- ✅ Команды выполняются с таймаутом
- ✅ CORS настроен
- ⚠️ Используйте HTTPS в продакшене
- ⚠️ Смените `JWT_SECRET` и пароль администратора

---

## Лицензия

MIT
