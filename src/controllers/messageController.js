import { consultationModel } from '../models/consultationModel.js';
import { userModel } from '../models/userModel.js';
import { messageModel } from '../models/messageModel.js';
import { AppError } from '../utils/AppError.js';
import { assertValid } from '../utils/validate.js';
import { parseId } from '../utils/params.js';

export async function listMessages(req, res) {
  const consultationId = parseId(req.params.id, 'ідентифікатор консультації');
  const consultation = await consultationModel.findByIdCore(consultationId);
  if (!consultation) throw new AppError(404, 'Консультацію не знайдено');

  res.json({ data: await messageModel.findByConsultation(consultationId) });
}

export async function createMessage(req, res) {
  const consultationId = parseId(req.params.id, 'ідентифікатор консультації');
  assertValid(req.body, {
    senderId: ['required', 'positiveInt'],
    text: ['required', 'string', ['min', 1], ['max', 2000]],
  });
  const { senderId, text } = req.body;

  const consultation = await consultationModel.findByIdCore(consultationId);
  if (!consultation) throw new AppError(404, 'Консультацію не знайдено');

  const sender = await userModel.findById(senderId);
  if (!sender) throw new AppError(404, 'Відправника не знайдено');

  // писати в чат можуть лише учасники консультації: клієнт або призначений юрист
  if (sender.id !== consultation.clientId && sender.id !== consultation.lawyerId) {
    throw new AppError(403, 'Лише учасники консультації можуть надсилати повідомлення');
  }

  const message = await messageModel.create({ consultationId, senderId, text });
  res.status(201).json({ data: message });
}
