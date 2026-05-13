import express from 'express';
import {
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { authenticateToken, requireAdmin, requireActive } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Получить активные категории (для всех пользователей)
router.get('/active', requireActive, getActiveCategories);

// Маршруты только для администраторов
router.get('/', requireAdmin, getAllCategories);
router.get('/:id', requireAdmin, getCategoryById);
router.post('/', requireAdmin, createCategory);
router.put('/:id', requireAdmin, updateCategory);
router.delete('/:id', requireAdmin, deleteCategory);

export default router;
