#!/bin/bash
# Деплой фичи: настройки устройства
SERVER="root@82.146.60.239"
PASS="nR7gT0dO8jcU"
BACKEND_DIR="/opt/command-executor-backup"
FRONTEND_DIR="/var/www/www-root/data/www/connect.gsmcanbox.ru"

echo "=== Копируем файлы backend ==="
pscp -pw "$PASS" backend/routes/deviceApi.js $SERVER:$BACKEND_DIR/routes/
pscp -pw "$PASS" backend/routes/deviceSettings.js $SERVER:$BACKEND_DIR/routes/
pscp -pw "$PASS" backend/server.js $SERVER:$BACKEND_DIR/server.js
pscp -pw "$PASS" backend/scripts/migrate_device_settings.sql $SERVER:/tmp/

echo "=== Применяем миграцию БД ==="
plink -ssh $SERVER -pw "$PASS" -batch \
  "psql -U postgres -d command_executor -f /tmp/migrate_device_settings.sql"

echo "=== Перезапускаем backend ==="
plink -ssh $SERVER -pw "$PASS" -batch "pm2 restart command-executor"

echo "=== Собираем frontend ==="
cd frontend && npm run build && cd ..

echo "=== Копируем frontend ==="
pscp -pw "$PASS" -r frontend/dist/* $SERVER:$FRONTEND_DIR/

echo "=== Готово ==="
