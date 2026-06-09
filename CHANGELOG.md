# GCBox Connect — Changelog

---

## 2026-06-09

### Команды устройства по категориям

- `deviceSettings.js` — переработан `GET /api/device-settings`: команды берутся через `device_categories` (многие-ко-многим) вместо старого `d.category_id`
- Логика отображения: если у подкатегории есть команды → заголовок = подкатегория; иначе → команды родительской категории, заголовок = категория
- Ответ теперь возвращает `command_groups: [{ label, commands[] }]`
- `userCard.js` — исправлена ошибка `column c.label does not exist`; аналогичная переработка на `device_categories` + `commandGroups`
- `Profile.jsx` — секция "Доступные команды" переработана: группы с заголовком категории, кнопки внутри каждой группы
- `UserCard.jsx` — секция команд переработана на `commandGroups`; убраны устаревшие состояния brands/models/selectedBrand/selectedModel и форма выбора марки/модели
- `frontend/package.json` — добавлен скрипт `deploy`: `vite build && cp -r dist/. /var/www/www-root/data/www/connect.gsmcanbox.ru/`
- Исправлен деплой: nginx раздаёт из `/var/www/www-root/data/www/connect.gsmcanbox.ru/`, а не из `/opt/.../dist/`

---

## 2026-06-07

### Перенос локальных файлов

- Локальные файлы проекта перенесены из `C:\1` в `C:\Projects\gcb-connect\`

---

## 2026-05-11

### Initial commit

- Первоначальная структура проекта: backend (Node.js/Express/Socket.io/PostgreSQL) + frontend (React/Vite)
- Авторизация JWT, роли admin/user
- Команды с CAN-данными, категории иерархические
- Устройства, привязка к пользователям
- Права доступа по категориям (`user_category_permissions`, `device_categories`)
- Telegram-бот интеграция
- Прошивки (firmware): загрузка, push на устройства, планирование
- Dashboard с выполнением команд по Socket.io
- Личный кабинет (Profile): телефоны, серийный номер, Telegram привязка
- AdminPanel: пользователи, команды, категории, устройства, логи, ПО, почта
- UserCard: карточка клиента с логами команд и авторизации
