import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Все маршруты требуют аутентификации и прав администратора
router.use(authenticateToken, requireAdmin);

// Получить всех пользователей
router.get('/', getAllUsers);

// Получить пользователя по ID
router.get('/:id', getUserById);

// Обновить пользователя
router.put('/:id', updateUser);

// Удалить пользователя
router.delete('/:id', deleteUser);

// Активировать/деактивировать пользователя
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
