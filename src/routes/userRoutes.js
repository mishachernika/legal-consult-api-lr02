import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список користувачів (клієнти, юристи, адміністратори)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [CLIENT, LAWYER, ADMIN] }
 *         description: Фільтр за роллю
 *     responses:
 *       200: { description: Список користувачів }
 *       400: { description: Невідома роль у фільтрі }
 *   post:
 *     summary: Створення користувача
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               phone: { type: string, maxLength: 20 }
 *               role: { type: string, enum: [CLIENT, LAWYER, ADMIN], default: CLIENT }
 *     responses:
 *       201: { description: Користувача створено }
 *       400: { description: Помилка валідації даних }
 *       409: { description: Email вже зайнятий }
 */
router.get('/', getUsers);
router.post('/', createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Картка користувача за ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Картка користувача }
 *       404: { description: Користувача не знайдено }
 *   put:
 *     summary: Оновлення даних користувача
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Дані оновлено }
 *       400: { description: Помилка валідації даних }
 *       404: { description: Користувача не знайдено }
 *       409: { description: Email вже зайнятий }
 *   delete:
 *     summary: Видалення користувача
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Користувача видалено }
 *       404: { description: Користувача не знайдено }
 *       409: { description: Є пов'язані записи (консультації тощо) }
 */
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
