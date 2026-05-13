import express from 'express';
import {
  updateCommandsOrder,
  getAllCommands,
  getActiveCommands,
  getCommandById,
  createCommand,
  updateCommand,
  deleteCommand,
  executeCommand,
  getCommandLogs,
  getAllLogs
} from '../controllers/commandController.js';
import { authenticateToken, requireAdmin, requireActive } from '../middleware/auth.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получить активные команды (для всех пользователей)
router.get('/active', requireActive, getActiveCommands);

// Маршруты только для администраторов
router.get('/', requireAdmin, getAllCommands);
router.get('/logs/all', requireAdmin, getAllLogs);
router.post('/', requireAdmin, createCommand);

// ВАЖНО: специфичные маршруты должны быть ПЕРЕД параметризованными
router.put('/order', requireAdmin, updateCommandsOrder);

// Параметризованные маршруты
router.get('/:id', requireAdmin, getCommandById);
router.put('/:id', requireAdmin, updateCommand);
router.delete('/:id', requireAdmin, deleteCommand);
router.post('/:id/execute', requireActive, executeCommand);
router.get('/:id/logs', getCommandLogs);

export default router;
