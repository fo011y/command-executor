# Быстрый старт - Command Executor

## Шаг 1: PostgreSQL

```bash
# Ubuntu
sudo apt install postgresql
sudo systemctl start postgresql

# Создать БД
sudo -u postgres psql
CREATE DATABASE command_executor;
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE command_executor TO myuser;
\q
```

## Шаг 2: Backend

```bash
cd backend
npm install
cp .env.example .env
# Отредактируйте .env (DB настройки, JWT_SECRET)
npm run init-db
npm run dev
```

Backend: http://localhost:5000

## Шаг 3: Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend: http://localhost:3000

## Шаг 4: Первый вход

1. Откройте http://localhost:3000
2. Войдите как админ:
   - Email: `admin@example.com`
   - Пароль: `admin123`
3. Смените пароль в админ-панели!

## Шаг 5: Создайте команду

1. Админ-панель → Команды → Добавить
2. Пример:
   - Название: `Проверка диска`
   - Команда: `df -h`
   - Активна: ✓

## Готово!

Теперь пользователи могут выполнять команды через веб-интерфейс.

## Структура

```
command-executor/
├── backend/          # Node.js + Express + PostgreSQL
├── frontend/         # React + Vite
└── README.md         # Полная документация
```

## Порты

- Backend: 5000
- Frontend: 3000
- PostgreSQL: 5432

## Важно

⚠️ Смените `JWT_SECRET` в `.env`  
⚠️ Смените пароль администратора  
⚠️ Используйте HTTPS в продакшене
