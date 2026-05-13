import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserPermissions,
  updateUserPermissions
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Маршруты для обычных пользователей (только аутентификация)
router.get('/me', authenticateToken, async (req, res) => {
  // Перенаправляем на getUserById с ID текущего пользователя
  req.params.id = req.user.id;
  return getUserById(req, res);
});

router.put('/me', authenticateToken, async (req, res) => {
  // Перенаправляем на updateUser с ID текущего пользователя
  req.params.id = req.user.id;
  return updateUser(req, res);
});

// Все остальные маршруты требуют прав администратора
router.use(authenticateToken, requireAdmin);

// Получить всех пользователей
router.get('/', getAllUsers);

// Получить права доступа пользователя (ДОЛЖНО БЫТЬ ДО /:id)
router.get('/:id/permissions', getUserPermissions);

// Обновить права доступа пользователя (ДОЛЖНО БЫТЬ ДО /:id)
router.put('/:id/permissions', updateUserPermissions);

// Активировать/деактивировать пользователя (ДОЛЖНО БЫТЬ ДО /:id)
router.patch('/:id/toggle-status', toggleUserStatus);

// Получить пользователя по ID
router.get('/:id', getUserById);

// Обновить пользователя
router.put('/:id', updateUser);

// Удалить пользователя
router.delete('/:id', deleteUser);

export default router;
