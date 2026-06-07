import express from 'express';
import {
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

// Выполнить команду (для всех активных пользователей)
router.post('/:id/execute', requireActive, executeCommand);

// Получить логи команды
router.get('/:id/logs', getCommandLogs);

// Маршруты только для администраторов
router.get('/', requireAdmin, getAllCommands);
router.get('/logs/all', requireAdmin, getAllLogs);
router.get('/:id', requireAdmin, getCommandById);
router.post('/', requireAdmin, createCommand);
router.put('/:id', requireAdmin, updateCommand);
router.delete('/:id', requireAdmin, deleteCommand);

export default router;
