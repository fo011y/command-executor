# Структура проекта Command Executor

```
command-executor/
│
├── README.md                    # Полная документация проекта
├── QUICKSTART.md                # Быстрый старт
├── STM32_INTEGRATION.md         # Интеграция с STM32/SIM868E
├── .gitignore                   # Git ignore файл
│
├── backend/                     # Backend сервер (Node.js)
│   ├── config/
│   │   └── database.js          # Конфигурация PostgreSQL
│   │
│   ├── controllers/
│   │   ├── authController.js    # Регистрация, вход
│   │   ├── userController.js    # Управление пользователями
│   │   └── commandController.js # Управление и выполнение команд
│   │
│   ├── middleware/
│   │   └── auth.js              # JWT аутентификация
│   │
│   ├── routes/
│   │   ├── auth.js              # Маршруты аутентификации
│   │   ├── users.js             # Маршруты пользователей
│   │   └── commands.js          # Маршруты команд
│   │
│   ├── scripts/
│   │   └── initDb.js            # Инициализация базы данных
│   │
│   ├── .env.example             # Пример переменных окружения
│   ├── .gitignore               # Backend git ignore
│   ├── package.json             # Backend зависимости
│   ├── server.js                # Главный файл сервера
│   └── README.md                # Backend документация
│
└── frontend/                    # Frontend приложение (React)
    ├── src/
    │   ├── api/
    │   │   ├── api.js           # HTTP клиент (axios)
    │   │   └── socket.js        # WebSocket клиент (Socket.io)
    │   │
    │   ├── components/
    │   │   ├── Login.jsx        # Страница входа
    │   │   ├── Register.jsx     # Страница регистрации
    │   │   ├── Dashboard.jsx    # Главная страница пользователя
    │   │   ├── AdminPanel.jsx   # Админ-панель
    │   │   ├── ProtectedRoute.jsx # Защищенные маршруты
    │   │   ├── Auth.css         # Стили аутентификации
    │   │   ├── Dashboard.css    # Стили dashboard
    │   │   └── AdminPanel.css   # Стили админ-панели
    │   │
    │   ├── context/
    │   │   └── AuthContext.jsx  # Контекст аутентификации
    │   │
    │   ├── App.jsx              # Главный компонент с роутингом
    │   ├── main.jsx             # Точка входа
    │   └── index.css            # Глобальные стили
    │
    ├── index.html               # HTML шаблон
    ├── vite.config.js           # Конфигурация Vite
    ├── .env.example             # Пример переменных окружения
    ├── .gitignore               # Frontend git ignore
    ├── package.json             # Frontend зависимости
    └── README.md                # Frontend документация
```

## Файлы по категориям

### Документация (5 файлов)
- `README.md` - Полная документация
- `QUICKSTART.md` - Быстрый старт
- `STM32_INTEGRATION.md` - Интеграция с железом
- `backend/README.md` - Backend документация
- `frontend/README.md` - Frontend документация

### Backend (15 файлов)
- **Конфигурация**: 1 файл
- **Контроллеры**: 3 файла (auth, users, commands)
- **Middleware**: 1 файл (аутентификация)
- **Маршруты**: 3 файла (auth, users, commands)
- **Скрипты**: 1 файл (инициализация БД)
- **Главные файлы**: 6 файлов (server.js, package.json, .env.example, и т.д.)

### Frontend (18 файлов)
- **API**: 2 файла (HTTP и WebSocket клиенты)
- **Компоненты**: 8 файлов (5 JSX + 3 CSS)
- **Контекст**: 1 файл (AuthContext)
- **Главные файлы**: 7 файлов (App.jsx, main.jsx, index.html, и т.д.)

## Всего файлов: 38

## Ключевые технологии

### Backend
- Node.js + Express
- Socket.io (WebSocket)
- PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs

### Frontend
- React 18
- Vite
- React Router v6
- Socket.io-client
- Axios

## Порты по умолчанию

- **Backend**: 5000
- **Frontend**: 3000
- **PostgreSQL**: 5432

## Следующие шаги

1. Установите PostgreSQL
2. Установите зависимости backend: `cd backend && npm install`
3. Настройте `.env` в backend
4. Инициализируйте БД: `npm run init-db`
5. Запустите backend: `npm run dev`
6. Установите зависимости frontend: `cd frontend && npm install`
7. Запустите frontend: `npm run dev`
8. Откройте http://localhost:3000

## Первый вход

- Email: `admin@example.com`
- Пароль: `admin123`

⚠️ **Сразу смените пароль администратора!**
