import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Импорт маршрутов
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import commandRoutes from './routes/commands.js';
import profileRoutes from './routes/profile.js';
import userCardRoutes from './routes/userCard.js';
import deviceRoutes from './routes/devices.js';
import firmwareRoutes from './routes/firmware.js';
import categoryRoutes from './routes/categories.js';
import emailSettingsRoutes from './routes/emailSettings.js';
import telegramLinkRoutes from './routes/telegramLink.js';
import botExecuteRoutes from './routes/botExecute.js';
import { startFirmwareCron } from './scripts/firmwareCron.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/user-card', userCardRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/firmware', firmwareRoutes);
app.use('/api/email-settings', emailSettingsRoutes);
app.use('/api/telegram', telegramLinkRoutes);
app.use('/api/bot', botExecuteRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'Command Executor API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      commands: '/api/commands'
    }
  });
});

// Middleware для аутентификации Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: Token required'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = decoded;
    next();
  });
});

// Socket.io обработчики
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.email} (ID: ${socket.user.id})`);

  // Присоединение к комнате пользователя
  socket.join(`user_${socket.user.id}`);

  // Если администратор - присоединить к комнате админов
  if (socket.user.role === 'admin') {
    socket.join('admins');
  }

  // Отправка приветственного сообщения
  socket.emit('connected', {
    message: 'Connected to Command Executor',
    user: {
      id: socket.user.id,
      email: socket.user.email,
      role: socket.user.role
    }
  });

  // Обработка выполнения команды в реальном времени
  socket.on('command:execute', async (data) => {
    console.log(`Command execution requested by ${socket.user.email}:`, data);

    // Уведомление пользователя о начале выполнения
    socket.emit('command:started', {
      commandId: data.commandId,
      timestamp: new Date().toISOString()
    });

    // Уведомление администраторов
    io.to('admins').emit('command:execution', {
      user: socket.user.email,
      commandId: data.commandId,
      timestamp: new Date().toISOString()
    });
  });

  // Обработка завершения выполнения команды
  socket.on('command:completed', (data) => {
    console.log(`Command completed:`, data);

    // Уведомление пользователя
    socket.emit('command:result', data);

    // Уведомление администраторов
    io.to('admins').emit('command:log', {
      user: socket.user.email,
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Обработка отключения
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.email}`);
  });

  // Обработка ошибок
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.user.email}:`, error);
  });
});

// Функция для отправки уведомлений пользователю
export const notifyUser = (userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

// Функция для отправки уведомлений администраторам
export const notifyAdmins = (event, data) => {
  io.to('admins').emit(event, data);
};

// Функция для отправки уведомлений всем
export const notifyAll = (event, data) => {
  io.emit(event, data);
};

// Экспорт io для использования в других модулях
export { io };

// Обработка ошибок 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  startFirmwareCron(io);
  console.log('=================================');
  console.log('🚀 Command Executor Server');
  console.log('=================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('=================================');
});

// Обработка завершения процесса
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
