#!/bin/bash

# Command Executor - Автоматическая установка на Ubuntu сервер
# Запуск: sudo bash install.sh

set -e

echo "=================================="
echo "Command Executor - Установка"
echo "=================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Проверка root прав
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Запустите скрипт с sudo${NC}"
    exit 1
fi

# Переменные
PROJECT_DIR="/var/www/command-executor"
DB_NAME="command_executor"
DB_USER="cmd_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

echo -e "${GREEN}Шаг 1/10: Обновление системы${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Шаг 2/10: Установка Node.js 20.x${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${GREEN}Шаг 3/10: Установка PostgreSQL${NC}"
apt install -y postgresql postgresql-contrib

echo -e "${GREEN}Шаг 4/10: Установка Nginx${NC}"
apt install -y nginx

echo -e "${GREEN}Шаг 5/10: Настройка PostgreSQL${NC}"
systemctl start postgresql
systemctl enable postgresql

# Создание базы данных и пользователя
sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
\q
EOF

echo -e "${GREEN}Шаг 6/10: Создание директории проекта${NC}"
mkdir -p ${PROJECT_DIR}
cd ${PROJECT_DIR}

echo -e "${GREEN}Шаг 7/10: Создание backend структуры${NC}"
mkdir -p backend/config backend/controllers backend/middleware backend/routes backend/scripts

# Создание package.json для backend
cat > backend/package.json << 'PKGJSON'
{
  "name": "command-executor-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "express-validator": "^7.0.1"
  }
}
PKGJSON

# Создание .env файла
cat > backend/.env << ENVFILE
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}

CLIENT_URL=http://$(curl -s ifconfig.me)
ENVFILE

echo -e "${YELLOW}База данных создана:${NC}"
echo "  DB_NAME: ${DB_NAME}"
echo "  DB_USER: ${DB_USER}"
echo "  DB_PASSWORD: ${DB_PASSWORD}"
echo ""
echo -e "${YELLOW}JWT_SECRET: ${JWT_SECRET}${NC}"
echo ""
echo -e "${YELLOW}Админ по умолчанию:${NC}"
echo "  Email: ${ADMIN_EMAIL}"
echo "  Password: ${ADMIN_PASSWORD}"
echo ""

# Сохранение учетных данных
cat > ${PROJECT_DIR}/CREDENTIALS.txt << CREDFILE
=================================
Command Executor - Учетные данные
=================================

База данных PostgreSQL:
  DB_NAME: ${DB_NAME}
  DB_USER: ${DB_USER}
  DB_PASSWORD: ${DB_PASSWORD}

JWT Secret:
  ${JWT_SECRET}

Администратор (СМЕНИТЕ ПАРОЛЬ!):
  Email: ${ADMIN_EMAIL}
  Password: ${ADMIN_PASSWORD}

Сервер:
  IP: $(curl -s ifconfig.me)
  Backend: http://$(curl -s ifconfig.me):5000
  Frontend: http://$(curl -s ifconfig.me)

=================================
CREDFILE

chmod 600 ${PROJECT_DIR}/CREDENTIALS.txt

echo -e "${GREEN}Учетные данные сохранены в: ${PROJECT_DIR}/CREDENTIALS.txt${NC}"

echo -e "${GREEN}Шаг 8/10: Загрузка исходного кода${NC}"
echo "Скопируйте файлы проекта в ${PROJECT_DIR}"
echo "Нажмите Enter когда файлы будут скопированы..."
read

echo -e "${GREEN}Шаг 9/10: Установка зависимостей${NC}"
cd ${PROJECT_DIR}/backend
npm install --production

echo -e "${GREEN}Инициализация базы данных${NC}"
node scripts/initDb.js

echo -e "${GREEN}Сборка frontend${NC}"
cd ${PROJECT_DIR}/frontend
npm install
npm run build

echo -e "${GREEN}Шаг 10/10: Настройка Nginx${NC}"
cat > /etc/nginx/sites-available/command-executor << 'NGINXCONF'
server {
    listen 80;
    server_name _;

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/command-executor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo -e "${GREEN}Установка PM2 для автозапуска${NC}"
npm install -g pm2

cd ${PROJECT_DIR}/backend
pm2 start server.js --name command-executor
pm2 startup systemd -u root --hp /root
pm2 save

echo ""
echo "=================================="
echo -e "${GREEN}✅ Установка завершена!${NC}"
echo "=================================="
echo ""
echo "Приложение доступно по адресу:"
echo -e "${GREEN}http://$(curl -s ifconfig.me)${NC}"
echo ""
echo "Учетные данные сохранены в:"
echo "${PROJECT_DIR}/CREDENTIALS.txt"
echo ""
echo -e "${YELLOW}⚠️  ВАЖНО: Смените пароль администратора после первого входа!${NC}"
echo ""
echo "Проверка статуса:"
echo "  pm2 status"
echo "  pm2 logs command-executor"
echo ""
