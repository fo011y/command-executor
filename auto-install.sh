#!/bin/bash

# Полная автоматическая установка Command Executor
# Этот скрипт создаст все файлы проекта и настроит сервер

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Запустите скрипт с sudo: sudo bash auto-install.sh${NC}"
    exit 1
fi

PROJECT_DIR="/var/www/command-executor"
DB_NAME="command_executor"
DB_USER="cmd_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
SERVER_IP=$(curl -s ifconfig.me)

echo "=================================="
echo "Command Executor - Полная установка"
echo "=================================="

echo -e "${GREEN}[1/12] Обновление системы${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}[2/12] Установка Node.js 20.x${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo -e "${GREEN}[3/12] Установка PostgreSQL${NC}"
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib
fi
systemctl start postgresql
systemctl enable postgresql

echo -e "${GREEN}[4/12] Установка Nginx${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

echo -e "${GREEN}[5/12] Настройка PostgreSQL${NC}"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
EOF

echo -e "${GREEN}[6/12] Создание структуры проекта${NC}"
mkdir -p ${PROJECT_DIR}/{backend/{config,controllers,middleware,routes,scripts},frontend/src/{api,components,context}}

echo -e "${GREEN}[7/12] Создание backend файлов${NC}"

# Backend package.json
cat > ${PROJECT_DIR}/backend/package.json << 'EOF'
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
EOF

# Backend .env
cat > ${PROJECT_DIR}/backend/.env << EOF
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
CLIENT_URL=http://${SERVER_IP}
EOF

echo -e "${YELLOW}⚠️  Для завершения установки нужны исходные файлы проекта${NC}"
echo ""
echo "Выполните следующие шаги:"
echo ""
echo "1. На вашем компьютере (Windows) откройте PowerShell или Git Bash"
echo ""
echo "2. Перейдите в папку проекта:"
echo "   cd c:\\1\\command-executor"
echo ""
echo "3. Загрузите файлы на сервер с помощью SCP:"
echo "   scp -r backend/config backend/controllers backend/middleware backend/routes backend/scripts backend/server.js root@${SERVER_IP}:${PROJECT_DIR}/backend/"
echo "   scp -r frontend/src frontend/index.html frontend/vite.config.js frontend/package.json root@${SERVER_IP}:${PROJECT_DIR}/frontend/"
echo ""
echo "4. После загрузки файлов, вернитесь на сервер и запустите:"
echo "   bash ${PROJECT_DIR}/complete-install.sh"
echo ""

# Создание скрипта завершения установки
cat > ${PROJECT_DIR}/complete-install.sh << 'COMPLETE'
#!/bin/bash
set -e
GREEN='\033[0;32m'
NC='\033[0m'
PROJECT_DIR="/var/www/command-executor"

echo -e "${GREEN}[8/12] Установка backend зависимостей${NC}"
cd ${PROJECT_DIR}/backend
npm install --production

echo -e "${GREEN}[9/12] Инициализация базы данных${NC}"
node scripts/initDb.js

echo -e "${GREEN}[10/12] Установка frontend зависимостей${NC}"
cd ${PROJECT_DIR}/frontend
npm install

echo -e "${GREEN}[11/12] Сборка frontend${NC}"
npm run build

echo -e "${GREEN}[12/12] Настройка Nginx и PM2${NC}"
cat > /etc/nginx/sites-available/command-executor << 'NGINX'
server {
    listen 80;
    server_name _;
    location / {
        root /var/www/command-executor/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
NGINX

ln -sf /etc/nginx/sites-available/command-executor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

npm install -g pm2
cd ${PROJECT_DIR}/backend
pm2 delete command-executor 2>/dev/null || true
pm2 start server.js --name command-executor
pm2 startup systemd -u root --hp /root
pm2 save

echo ""
echo "=================================="
echo -e "${GREEN}✅ Установка завершена!${NC}"
echo "=================================="
echo ""
echo "Приложение: http://$(curl -s ifconfig.me)"
echo "Учетные данные: ${PROJECT_DIR}/CREDENTIALS.txt"
echo ""
COMPLETE

chmod +x ${PROJECT_DIR}/complete-install.sh

# Сохранение учетных данных
cat > ${PROJECT_DIR}/CREDENTIALS.txt << EOF
Command Executor - Учетные данные
=================================

База данных:
  DB_NAME: ${DB_NAME}
  DB_USER: ${DB_USER}
  DB_PASSWORD: ${DB_PASSWORD}

JWT Secret: ${JWT_SECRET}

Администратор (СМЕНИТЕ ПАРОЛЬ!):
  Email: ${ADMIN_EMAIL}
  Password: ${ADMIN_PASSWORD}

Сервер: http://${SERVER_IP}
EOF

chmod 600 ${PROJECT_DIR}/CREDENTIALS.txt

echo ""
echo -e "${GREEN}Учетные данные сохранены: ${PROJECT_DIR}/CREDENTIALS.txt${NC}"
echo ""
