# GCBox Connect — Инструкция по деплою

## Сервер

- **IP:** 80.87.198.101
- **User:** root
- **Подключение:** `plink -ssh root@80.87.198.101 -pw "9nZprK42GB3g" -batch`
- **Передача файлов:** `pscp -pw "9nZprK42GB3g" <src> root@80.87.198.101:<dst>`

## Структура на сервере

```
/opt/connect.gsmcanbox.ru/
├── backend/          ← Node.js исходники (рабочая копия)
└── frontend/         ← React/Vite исходники (рабочая копия)
    └── dist/         ← сборка (НЕ раздаётся nginx напрямую)

/var/www/www-root/data/www/connect.gsmcanbox.ru/  ← nginx root (раздаётся браузеру)
```

> ⚠️ nginx раздаёт из `/var/www/...`, а НЕ из `/opt/.../dist/`. После сборки нужно копировать!

## Деплой фронтенда

### Загрузить изменённые файлы:
```bash
pscp -pw "9nZprK42GB3g" frontend/src/components/MyFile.jsx root@80.87.198.101:/opt/connect.gsmcanbox.ru/frontend/src/components/MyFile.jsx
```

### Собрать и задеплоить (на сервере):
```bash
plink -ssh root@80.87.198.101 -pw "9nZprK42GB3g" -batch "cd /opt/connect.gsmcanbox.ru/frontend && npm run deploy"
```

`npm run deploy` = `vite build` + `cp -r dist/. /var/www/www-root/data/www/connect.gsmcanbox.ru/`

## Деплой бэкенда

### Загрузить файл:
```bash
pscp -pw "9nZprK42GB3g" backend/routes/myRoute.js root@80.87.198.101:/opt/connect.gsmcanbox.ru/backend/routes/myRoute.js
```

### Перезапустить:
```bash
plink -ssh root@80.87.198.101 -pw "9nZprK42GB3g" -batch "pm2 restart command-executor"
```

## PM2 процессы

| ID | Имя | Описание |
|----|-----|----------|
| 3 | command-executor | Backend API (порт 5000) |
| 4 | gcb-bot | Telegram бот |
| 2 | gsmcanbox-api | gsmcanbox.ru backend |

## Nginx конфиг

`/etc/nginx/vhosts/www-root/connect.gsmcanbox.ru.conf`

- root → `/var/www/www-root/data/www/connect.gsmcanbox.ru`
- `/api/` → proxy `http://localhost:5000`
- `/socket.io/` → proxy `http://localhost:5000`
- SPA: `try_files $uri $uri/ /index.html`

## База данных

- **БД:** PostgreSQL на localhost
- **Конфиг:** `/opt/connect.gsmcanbox.ru/backend/.env`

## GitHub

- **Repo:** `fo011y/gcb-connect`
- **Ветка:** `master`
