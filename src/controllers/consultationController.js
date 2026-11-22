import { consultationModel } from '../models/consultationModel.js';
import { userModel } from '../models/userModel.js';
import { lawyerModel } from '../models/lawyerModel.js';
import { AppError } from '../utils/AppError.js';
import { assertValid } from '../utils/validate.js';
import { parseId } from '../utils/params.js';

export const STATUSES = 'PENDING,CONFIRMED,IN_PROGRESS,COMPLETED,CANCELLED';

export async function getConsultations(req, res) {
  const { clientId, lawyerId, status } = req.query;
  const where = {};
  if (clientId) where.clientId = parseId(clientId, 'ідентифікатор клієнта');
  if (lawyerId) where.lawyerId = parseId(lawyerId, 'ідентифікатор юриста');
  if (status) {
    if (!STATUSES.split(',').includes(status)) {
      throw new AppError(400, 'Невідомий статус консультації', { status: [`допустимі значення: ${STATUSES}`] });
    }
    where.status = status;
  }

  res.json({ data: await consultationModel.findAll(where) });
}

export async function getConsultationById(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор консультації');
  const consultation = await consultationModel.findById(id);
  if (!consultation) throw new AppError(404, 'Консультацію не знайдено');
  res.json({ data: consultation });
}

export async function createConsultation(req, res) {
  assertValid(req.body, {
    clientId: ['required', 'positiveInt'],
    lawyerId: ['required', 'positiveInt'],
    topic: ['required', 'string', ['min', 5], ['max', 200]],
    description: ['required', 'string', ['min', 10], ['max', 5000]],
    scheduledAt: ['date'],
    price: ['nonNegativeNumber'],
  });
  const { clientId, lawyerId, topic, description, scheduledAt, price } = req.body;

  const client = await userModel.findById(clientId);
  if (!client) throw new AppError(404, 'Клієнта не знайдено');

  const lawyerProfile = await lawyerModel.findByUserId(lawyerId);
  if (!lawyerProfile) throw new AppError(404, 'Профіль юриста не знайдено');

  const consultation = await consultationModel.create({
    clientId,
    lawyerId,
    topic,
    description,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    // якщо ціну не передано, беремо погодинну ставку юриста
    price: price ?? lawyerProfile.pricePerHour,
  });
  res.status(201).json({ data: consultation });
}

export async function updateConsultation(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор консультації');
  assertValid(req.body, {
    lawyerId: ['positiveInt'],
    topic: ['string', ['min', 5], ['max', 200]],
    description: ['string', ['min', 10], ['max', 5000]],
    status: [['enum', STATUSES]],
    scheduledAt: ['date'],
    price: ['nonNegativeNumber'],
  });
  const { lawyerId, topic, description, status, scheduledAt, price } = req.body ?? {};
  if ([lawyerId, topic, description, status, scheduledAt, price].every((v) => v === undefined)) {
    throw new AppError(400, 'Не передано жодного поля для оновлення');
  }
  if (lawyerId) {
    const lawyerProfile = await lawyerModel.findByUserId(lawyerId);
    if (!lawyerProfile) throw new AppError(404, 'Профіль юриста не знайдено');
  }
  const data = {};
  if (lawyerId !== undefined) data.lawyerId = lawyerId;
  if (topic !== undefined) data.topic = topic;
  if (description !== undefined) data.description = description;
  if (status !== undefined) data.status = status;
  if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt);
  if (price !== undefined) data.price = price;

  const consultation = await consultationModel.update(id, data);
  res.json({ data: consultation });
}

export async function deleteConsultation(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор консультації');
  await consultationModel.remove(id);
  res.status(204).end();
}
