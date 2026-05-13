# Command Executor - Инструкция по установке на сервер

## Вариант 1: Простая установка (рекомендуется)

### Шаг 1: Подключитесь к серверу
```bash
ssh root@82.146.60.239
# Пароль: nR7gT0dO8jcU
```

### Шаг 2: Скачайте и запустите установочный скрипт
```bash
curl -o deploy.sh https://raw.githubusercontent.com/YOUR_REPO/command-executor/main/deploy.sh
chmod +x deploy.sh
sudo bash deploy.sh
```

## Вариант 2: Ручная установка (если нет GitHub)

### Шаг 1: Подключитесь к серверу через PuTTY или SSH

### Шаг 2: Скопируйте и выполните команды:

```bash
# Создать скрипт установки
cat > /tmp/quick-install.sh << 'SCRIPT_END'
#!/bin/bash
set -e

echo "Установка Command Executor..."

# Обновление системы
apt update && apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка PostgreSQL
apt install -y postgresql postgresql-contrib nginx

# Запуск PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Создание БД
DB_PASS=$(openssl rand -base64 20)
sudo -u postgres psql << EOF
CREATE DATABASE command_executor;
CREATE USER cmd_user WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE command_executor TO cmd_user;
ALTER DATABASE command_executor OWNER TO cmd_user;
EOF

echo "База данных создана!"
echo "Пароль БД: ${DB_PASS}"
echo "Сохраните этот пароль!"

# Создание директории
mkdir -p /var/www/command-executor
cd /var/www/command-executor

echo "Теперь загрузите файлы проекта в /var/www/command-executor"
echo "Используйте WinSCP или FileZilla"

SCRIPT_END

chmod +x /tmp/quick-install.sh
sudo bash /tmp/quick-install.sh
```

## Вариант 3: Загрузка файлов с вашего компьютера

### На Windows (PowerShell):

```powershell
# Установите WinSCP или используйте pscp (PuTTY)
# Скачайте: https://winscp.net/

# Или используйте pscp из командной строки:
cd C:\1\command-executor

# Загрузка backend
pscp -r backend root@82.146.60.239:/var/www/command-executor/

# Загрузка frontend  
pscp -r frontend root@82.146.60.239:/var/www/command-executor/
```

### Или используйте Git Bash:

```bash
cd /c/1/command-executor

# Создать архив
tar -czf command-executor.tar.gz backend frontend

# Загрузить на сервер (потребуется ввести пароль)
scp command-executor.tar.gz root@82.146.60.239:/tmp/

# Затем на сервере:
# ssh root@82.146.60.239
# cd /var/www
# tar -xzf /tmp/command-executor.tar.gz
```

## Вариант 4: Самый простой - я создам все файлы на сервере

Выполните эти команды на сервере (скопируйте всё целиком):

```bash
# Будет создан полный установочный скрипт
# Просто скопируйте и вставьте в терминал сервера
```

---

## После установки файлов:

```bash
cd /var/www/command-executor/backend

# Создать .env файл
nano .env
# Вставьте настройки БД из вывода скрипта

# Установить зависимости
npm install

# Инициализировать БД
node scripts/initDb.js

# Собрать frontend
cd ../frontend
npm install
npm run build

# Настроить Nginx
# (конфиг будет создан автоматически)

# Запустить с PM2
npm install -g pm2
cd ../backend
pm2 start server.js --name command-executor
pm2 startup
pm2 save
```

## Проверка

Откройте в браузере: http://82.146.60.239

Логин: admin@example.com
Пароль: admin123

---

## Какой вариант выбрать?

**Самый простой**: Я создам один большой скрипт, который создаст все файлы проекта прямо на сервере. Вам нужно будет только скопировать его и запустить.

Хотите, чтобы я создал такой скрипт?
