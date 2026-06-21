# GCB Connect — Changelog

---

## 2026-06-21

### Профиль пользователя — защита полей от редактирования

- `Profile.jsx` — поля Email, Серийный номер устройства и Номер телефона (основной) переведены в режим `disabled` (только чтение)
- Эти три поля присваиваются при регистрации и не могут быть изменены пользователем
- Поля Телефон 2 и Телефон 3 остаются редактируемыми
- Убрана валидация основного телефона и серийного номера из `handleSubmit` (нет смысла валидировать read-only поля)
- Убраны `module_serial` и `phone` из `updateData` при сохранении профиля

### Регистрация — добавлено поле телефона

- `Register.jsx` — добавлено обязательное поле "Номер телефона" с форматированием +7 и валидацией
- Добавлено жёлтое предупреждение под полем телефона: номер должен совпадать с указанным при оформлении заказа на gsmcanbox.ru
- `AuthContext.jsx` — `register()` принимает и передаёт `phone`
- `api.js` — `authAPI.register()` передаёт `phone` в тело запроса
- `authController.js` (backend) — принимает `phone` из `req.body`, сохраняет в БД при `INSERT INTO users`

### Исправление: устройство не отображалось в профиле

- `deviceSettings.js` (backend) — убрано несуществующее поле `label` из SELECT запросов к таблице `commands`; ошибка `column "label" does not exist` приводила к 500 и устройство не отображалось

---

## 2026-06-20

### Android-приложение (Flutter)

**Новый модуль `mobile/`** — полноценный Flutter-клиент для Android:

#### Архитектура
- `lib/api/` — HTTP-клиент на Dio с авто-подстановкой JWT; отдельные классы `AuthApi`, `CommandsApi`, `ProfileApi`
- `lib/providers/` — Provider-based state: `AuthProvider`, `CommandsProvider`, `ProfileProvider`, `SettingsProvider`
- `lib/services/` — `SocketService` (Socket.io), `SettingsService` (локальные настройки в secure storage)
- `lib/models/` — `User`, `Command`, `CommandLog`, `CarSettings`

#### Экраны
- **LoginScreen** — вход по email/паролю, обработка 403 (неактивный аккаунт)
- **DashboardScreen** — список команд по категориям, силуэт авто, real-time статус
- **ProfileScreen** — просмотр и редактирование профиля (email, телефоны)
- **CarSettingsScreen** — выбор модели авто, цвета кузова, расположения кнопок

#### UI/UX
- Силуэт автомобиля на главном экране (`CustomPainter`): Ford Focus 3 и Ford Kuga 2
- Кнопки команд в стиле иконок приложений: квадратные с закруглениями, градиент, тень, иконка по смыслу команды
- Выбор расположения кнопок: над или под изображением автомобиля
- Выбор цвета кузова (12 цветов), настройки сохраняются локально
- Тёмная тема в стиле GitHub Dark (`#0d1117` / `#161b22`)
- Иконка приложения — логотип gsmcanbox

#### Технические детали
- Сервер: `https://connect.gsmcanbox.ru` (HTTPS через Nginx)
- JWT хранится в `flutter_secure_storage`
- WebSocket подключается автоматически после логина
- Статус выполнения команды обновляется через Socket.io (`command:result`)
- APK: `mobile/build/app/outputs/flutter-apk/app-debug.apk`

### Исправления бэкенда

- **`userController.js`** — исправлен баг: `phone2` и `phone3` не сохранялись при обновлении профиля (поля не были добавлены в UPDATE-запрос)

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
