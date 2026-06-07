#!/bin/bash
# Command Executor - Полная установка в один скрипт
# Создает все файлы проекта и настраивает сервер

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

if [ "$EUID" -ne 0 ]; then echo -e "${RED}Запустите: sudo bash deploy-all-in-one.sh${NC}"; exit 1; fi

PROJECT_DIR="/var/www/command-executor"
DB_NAME="command_executor"
DB_USER="cmd_user"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo "========================================"; echo "Command Executor - Установка"; echo "========================================"

echo -e "${GREEN}[1/15] Обновление системы${NC}"
apt update -y && apt upgrade -y

echo -e "${GREEN}[2/15] Установка Node.js${NC}"
if ! command -v node &> /dev/null; then curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs; fi

echo -e "${GREEN}[3/15] Установка PostgreSQL${NC}"
if ! command -v psql &> /dev/null; then apt install -y postgresql postgresql-contrib; fi
systemctl start postgresql && systemctl enable postgresql

echo -e "${GREEN}[4/15] Установка Nginx${NC}"
if ! command -v nginx &> /dev/null; then apt install -y nginx; fi

echo -e "${GREEN}[5/15] Настройка PostgreSQL${NC}"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
EOF

echo -e "${GREEN}[6/15] Создание структуры${NC}"
mkdir -p ${PROJECT_DIR}/{backend/{config,controllers,middleware,routes,scripts},frontend/src/{api,components,context}}

echo -e "${GREEN}[7/15] Создание backend файлов${NC}"

# Все backend файлы будут созданы здесь...
# (Продолжение следует в следующем сообщении из-за ограничения размера)

