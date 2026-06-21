import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  registerToken,
  sendNotification,
  getTokens,
} from '../controllers/notificationController.js';

const router = express.Router();

// Регистрация FCM-токена (любой авторизованный пользователь)
router.post('/register-token', authenticateToken, registerToken);

// Отправка push-уведомления (только админ)
router.post('/send', authenticateToken, requireAdmin, sendNotification);

// Список зарегистрированных токенов (только админ)
router.get('/tokens', authenticateToken, requireAdmin, getTokens);

export default router;
