import { Router } from 'express';
import {
  getConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  deleteConsultation,
} from '../controllers/consultationController.js';
import { listMessages, createMessage } from '../controllers/messageController.js';

const router = Router();

/**
 * @swagger
 * /api/consultations:
 *   get:
 *     summary: Список консультацій з фільтрами
 *     tags: [Consultations]
 *     parameters:
 *       - in: query
 *         name: clientId
 *         schema: { type: integer }
 *       - in: query
 *         name: lawyerId
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED] }
 *     responses:
 *       200: { description: Список консультацій }
 *       400: { description: Невідомий статус у фільтрі }
 *   post:
 *     summary: Створення запиту на консультацію
 *     tags: [Consultations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, lawyerId, topic, description]
 *             properties:
 *               clientId: { type: integer }
 *               lawyerId: { type: integer }
 *               topic: { type: string, minLength: 5, maxLength: 200 }
 *               description: { type: string, minLength: 10, maxLength: 5000 }
 *               scheduledAt: { type: string, format: date-time }
 *               price: { type: number, minimum: 0, description: 'Якщо не передано — ставка юриста за годину' }
 *     responses:
 *       201: { description: Консультацію створено зі статусом PENDING }
 *       400: { description: Помилка валідації даних }
 *       404: { description: Клієнта або профіль юриста не знайдено }
 */
router.get('/', getConsultations);
router.post('/', createConsultation);

/**
 * @swagger
 * /api/consultations/{id}:
 *   get:
 *     summary: Картка консультації з чатом і відгуком
 *     tags: [Consultations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Картка консультації }
 *       404: { description: Консультацію не знайдено }
 *   put:
 *     summary: Оновлення консультації (зокрема зміна статусу)
 *     tags: [Consultations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Дані оновлено }
 *       400: { description: Помилка валідації даних }
 *       404: { description: Консультацію не знайдено }
 *   delete:
 *     summary: Видалення консультації (чат і відгук видаляться каскадом)
 *     tags: [Consultations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Консультацію видалено }
 *       404: { description: Консультацію не знайдено }
 */
router.get('/:id', getConsultationById);
router.put('/:id', updateConsultation);
router.delete('/:id', deleteConsultation);

/**
 * @swagger
 * /api/consultations/{id}/messages:
 *   get:
 *     summary: Історія чату консультації
 *     tags: [Consultations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Список повідомлень у хронологічному порядку }
 *       404: { description: Консультацію не знайдено }
 *   post:
 *     summary: Надсилання повідомлення в чат консультації
 *     tags: [Consultations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senderId, text]
 *             properties:
 *               senderId: { type: integer }
 *               text: { type: string, minLength: 1, maxLength: 2000 }
 *     responses:
 *       201: { description: Повідомлення надіслано }
 *       400: { description: Помилка валідації даних }
 *       403: { description: Відправник не є учасником консультації }
 *       404: { description: Консультацію або відправника не знайдено }
 */
router.get('/:id/messages', listMessages);
router.post('/:id/messages', createMessage);

export default router;
