# Command Executor - Frontend

React приложение для системы выполнения команд.

## Возможности

- 🔐 Аутентификация (вход/регистрация)
- 📊 Dashboard для выполнения команд
- 👨‍💼 Админ-панель для управления
- 🔄 Real-time обновления через WebSocket
- 📱 Адаптивный дизайн

## Структура

```
src/
├── api/
│   ├── api.js              # HTTP клиент (axios)
│   └── socket.js           # WebSocket клиент
├── components/
│   ├── Login.jsx           # Страница входа
│   ├── Register.jsx        # Страница регистрации
│   ├── Dashboard.jsx       # Главная страница пользователя
│   ├── AdminPanel.jsx      # Админ-панель
│   ├── ProtectedRoute.jsx  # Защищенные маршруты
│   ├── Auth.css            # Стили аутентификации
│   ├── Dashboard.css       # Стили dashboard
│   └── AdminPanel.css      # Стили админ-панели
├── context/
│   └── AuthContext.jsx     # Контекст аутентификации
├── App.jsx                 # Главный компонент с роутингом
├── main.jsx                # Точка входа
└── index.css               # Глобальные стили
```

## Установка

```bash
npm install
```

## Настройка

Создайте `.env` файл:

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

## Запуск

### Режим разработки
```bash
npm run dev
```

### Сборка для продакшена
```bash
npm run build
```

### Предпросмотр сборки
```bash
npm run preview
```

## Маршруты

- `/login` - Вход в систему
- `/register` - Регистрация
- `/dashboard` - Главная страница (требует авторизации)
- `/admin` - Админ-панель (требует роль admin)

## Компоненты

### AuthContext

Управляет состоянием аутентификации:

```jsx
const { user, token, login, logout, isAdmin, isActive } = useAuth();
```

### ProtectedRoute

Защищает маршруты от неавторизованных пользователей:

```jsx
<ProtectedRoute adminOnly>
  <AdminPanel />
</ProtectedRoute>
```

### Dashboard

Отображает доступные команды и позволяет их выполнять.

### AdminPanel

Три вкладки:
- **Пользователи** - управление пользователями
- **Команды** - создание и редактирование команд
- **Логи** - просмотр истории выполнения

## API клиент

```javascript
import { authAPI, usersAPI, commandsAPI } from './api/api';

// Аутентификация
await authAPI.login(email, password);
await authAPI.register(email, password);

// Пользователи
await usersAPI.getAll();
await usersAPI.update(id, data);

// Команды
await commandsAPI.getActive();
await commandsAPI.execute(id);
```

## WebSocket

```javascript
import { connectSocket, emitEvent, onEvent } from './api/socket';

// Подключение
connectSocket(token);

// Отправка события
emitEvent('command:execute', { commandId: 1 });

// Подписка на события
onEvent('command:result', (data) => {
  console.log('Result:', data);
});
```

## Стилизация

Используется чистый CSS с:
- Градиентами
- Анимациями
- Адаптивным дизайном
- Темной/светлой темой для разных элементов

## Сборка для продакшена

```bash
npm run build
```

Результат в папке `dist/`. Разверните на:
- Nginx
- Apache
- Vercel
- Netlify
- Firebase Hosting

## Переменные окружения

- `VITE_API_URL` - URL backend API
- `VITE_WS_URL` - URL WebSocket сервера

## Лицензия

MIT
