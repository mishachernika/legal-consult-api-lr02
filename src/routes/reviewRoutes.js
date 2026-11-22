import { Router } from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';

const router = Router();

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Список відгуків з фільтрами
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: lawyerId
 *         schema: { type: integer }
 *       - in: query
 *         name: clientId
 *         schema: { type: integer }
 *       - in: query
 *         name: minRating
 *         schema: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       200: { description: Список відгуків }
 *   post:
 *     summary: Відгук на завершену консультацію
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [consultationId, rating]
 *             properties:
 *               consultationId: { type: integer }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               text: { type: string, maxLength: 1000 }
 *     responses:
 *       201: { description: Відгук створено, рейтинг юриста перераховано }
 *       400: { description: Помилка валідації або консультація ще не завершена }
 *       404: { description: Консультацію не знайдено }
 *       409: { description: Відгук для цієї консультації вже існує }
 */
router.get('/', getReviews);
router.post('/', createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Відгук за ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Відгук }
 *       404: { description: Відгук не знайдено }
 *   put:
 *     summary: Оновлення відгуку
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Відгук оновлено, рейтинг юриста перераховано }
 *       400: { description: Помилка валідації даних }
 *   delete:
 *     summary: Видалення відгуку
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Відгук видалено }
 *       404: { description: Відгук не знайдено }
 */
router.get('/:id', getReviewById);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;
