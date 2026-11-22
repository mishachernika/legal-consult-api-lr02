import { Router } from 'express';
import {
  getSpecializations,
  getSpecializationById,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
} from '../controllers/specializationController.js';

const router = Router();

/**
 * @swagger
 * /api/specializations:
 *   get:
 *     summary: Довідник сфер права
 *     tags: [Specializations]
 *     responses:
 *       200: { description: Список сфер права з кількістю юристів }
 *   post:
 *     summary: Додавання сфери права
 *     tags: [Specializations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 3, maxLength: 100 }
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       201: { description: Сферу права створено }
 *       400: { description: Помилка валідації даних }
 *       409: { description: Така сфера вже існує }
 */
router.get('/', getSpecializations);
router.post('/', createSpecialization);

/**
 * @swagger
 * /api/specializations/{id}:
 *   get:
 *     summary: Сфера права за ID зі списком юристів
 *     tags: [Specializations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Сфера права }
 *       404: { description: Спеціалізацію не знайдено }
 *   put:
 *     summary: Оновлення сфери права
 *     tags: [Specializations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Дані оновлено }
 *       409: { description: Назва вже зайнята }
 *   delete:
 *     summary: Видалення сфери права
 *     tags: [Specializations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Сферу права видалено }
 *       404: { description: Спеціалізацію не знайдено }
 */
router.get('/:id', getSpecializationById);
router.put('/:id', updateSpecialization);
router.delete('/:id', deleteSpecialization);

export default router;
