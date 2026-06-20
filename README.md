# GCB Connect

Система удалённого управления автомобилем через CAN-шину. Состоит из веб-приложения и Android-приложения, которые через сервер отправляют команды на бортовой модуль GCB (STM32 + SIM868E).

## Возможности

✅ **Авторизация** — JWT, вход по email и паролю  
✅ **Команды по категориям** — пользователь видит только разрешённые категории  
✅ **Real-time статус** — WebSocket (Socket.io): результат команды приходит мгновенно  
✅ **Устройства** — привязка модуля GCB по серийному номеру к аккаунту  
✅ **Очередь команд** — модуль поллит сервер и подтверждает выполнение  
✅ **Телеметрия** — GPS-координаты, скорость, статус фикса  
✅ **Прошивки** — загрузка, отправка push на устройство, планирование обновления  
✅ **Telegram-бот** — уведомления и управление через бота  
✅ **Админ-панель** — пользователи, команды, категории, устройства, логи, ПО, почта  
✅ **Android-приложение** — нативный Flutter-клиент с силуэтом автомобиля  

## Технологии

### Backend
- **Node.js** + **Express** — REST API
- **Socket.io** — real-time коммуникация
- **PostgreSQL** — база данных
- **JWT** + **bcryptjs** — аутентификация
- **Nodemailer** — email-уведомления
- **node-cron** — планировщик задач
- **Multer** — загрузка файлов прошивок

### Frontend (веб)
- **React 18** + **Vite**
- **React Router 6**
- **Axios** + **Socket.io-client**

### Mobile (Android)
- **Flutter 3.44** + **Dart 3.12**
- **Dio** — HTTP-клиент
- **socket_io_client** — WebSocket
- **flutter_secure_storage** — хранение JWT
- **Provider** — state management
- **CustomPainter** — силуэт автомобиля

## Структура проекта

```
gcb-connect/
├── backend/                  # Node.js сервер
│   ├── config/               # Подключение к БД
│   ├── controllers/          # Логика эндпоинтов
│   ├── middleware/           # JWT, роли, requireActive
│   ├── routes/               # API маршруты
│   ├── services/             # Почта, Telegram
│   ├── scripts/              # Инициализация БД
│   └── server.js
│
├── frontend/                 # React веб-приложение
│   ├── src/
│   │   ├── api/              # Axios + Socket.io клиент
│   │   ├── components/       # React компоненты
│   │   └── context/          # AuthContext
│   └── vite.config.js
│
└── mobile/                   # Flutter Android-приложение
    ├── lib/
    │   ├── api/              # HTTP клиент (Dio)
    │   ├── models/           # User, Command, CarSettings
    │   ├── providers/        # Auth, Commands, Profile, Settings
    │   ├── screens/          # Login, Dashboard, Profile, CarSettings
    │   ├── services/         # SocketService, SettingsService
    │   └── widgets/          # CarSilhouette, CommandIconButton
    └── pubspec.yaml
```

## Быстрый старт

### Требования
- Node.js 18+
- PostgreSQL 12+
- Flutter 3.44+ (для мобильного)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # заполнить переменные
npm run init-db
npm run dev            # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

### Android APK

```bash
cd mobile
flutter pub get
flutter build apk --debug
# APK: build/app/outputs/flutter-apk/app-debug.apk
```

## API

### Аутентификация
```
POST /api/auth/register      — регистрация (email, password, serial_number)
POST /api/auth/login         — вход → { token, user }
GET  /api/auth/me            — текущий пользователь
```

### Команды
```
GET  /api/commands/active    — активные команды (с учётом прав)
POST /api/commands/:id/execute — выполнить команду
```

### Пользователь
```
GET  /api/users/me           — профиль
PUT  /api/users/me           — обновить (email, phone, phone2, phone3, password)
```

### Устройство (X-Device-Token)
```
POST /api/device/ping        — регистрация модуля
GET  /api/device/settings    — настройки (телефоны, команды)
POST /api/device/telemetry   — GPS-координаты
POST /api/device/commands/poll — получить следующую команду
POST /api/device/commands/ack  — подтвердить выполнение
```

## WebSocket (Socket.io)

**Подключение:** `wss://connect.gsmcanbox.ru?token=<jwt>`

| Событие | Направление | Описание |
|---------|-------------|----------|
| `connected` | S→C | Подтверждение подключения |
| `command:result` | S→C | Результат выполнения команды |
| `command:execution` | S→Admins | Уведомление о запуске (только админам) |

## Деплой

Сервер: `connect.gsmcanbox.ru` (IP: `80.87.198.101`)

```bash
# Загрузить файл бэкенда
pscp -pw "..." file.js root@80.87.198.101:/opt/connect.gsmcanbox.ru/backend/...

# Перезапустить бэкенд
plink -ssh root@80.87.198.101 -pw "..." -batch "pm2 restart command-executor"

# Задеплоить фронтенд
plink -ssh root@80.87.198.101 -pw "..." -batch "cd /opt/connect.gsmcanbox.ru/frontend && npm run deploy"
```

Подробнее — `DEPLOY_INSTRUCTIONS.md`.

## Безопасность

- Пароли хешируются bcrypt (salt=10)
- JWT с настраиваемым сроком жизни
- Новые пользователи неактивны до одобрения администратором
- Команды доступны только активным пользователям с нужными правами на категории
- HTTPS через Nginx + Let's Encrypt

## Лицензия

MIT
