import fs from 'node:fs/promises';
import path from 'node:path';
import { fileModel } from '../models/fileModel.js';
import { consultationModel } from '../models/consultationModel.js';
import { AppError } from '../utils/AppError.js';
import { parsePagination, paginate } from '../utils/pagination.js';
import { parseId } from '../utils/params.js';

// Якщо файл прив'язується до консультації — перевіряємо, що користувач її учасник (або ADMIN)
async function assertCanAttachToConsultation(consultationId, user) {
  const consultation = await consultationModel.findByIdCore(consultationId);
  if (!consultation) throw new AppError(404, 'Консультацію не знайдено');
  if (user.role !== 'ADMIN' && consultation.clientId !== user.userId && consultation.lawyerId !== user.userId) {
    throw new AppError(403, 'Лише учасники консультації можуть прикріплювати до неї файли');
  }
}

function fileData(req, extra = {}) {
  return {
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    uploadedBy: req.user.userId,
    ...extra,
  };
}

export async function uploadFile(req, res) {
  if (!req.file) throw new AppError(400, 'Файл не надано');

  let consultationId = null;
  if (req.body?.consultationId) {
    consultationId = parseId(req.body.consultationId, 'ідентифікатор консультації');
    await assertCanAttachToConsultation(consultationId, req.user);
  }

  try {
    const file = await fileModel.create(fileData(req, { consultationId }));
    res.status(201).json({ message: 'Файл успішно завантажено', file });
  } catch (error) {
    // Якщо запис у БД не вдався, не залишаємо «осиротілий» файл на диску
    await fs.unlink(req.file.path).catch(() => {});
    throw error;
  }
}

// Завантаження кількох файлів одночасно (до 5), поле форми — files[]
export async function uploadMultipleFiles(req, res) {
  if (!req.files?.length) throw new AppError(400, 'Файли не надано');

  let consultationId = null;
  if (req.body?.consultationId) {
    consultationId = parseId(req.body.consultationId, 'ідентифікатор консультації');
    await assertCanAttachToConsultation(consultationId, req.user);
  }

  const files = [];
  const errors = [];
  for (const f of req.files) {
    const singleReq = { ...req, file: f };
    try {
      files.push(await fileModel.create(fileData(singleReq, { consultationId })));
    } catch (error) {
      await fs.unlink(f.path).catch(() => {});
      errors.push({ originalName: f.originalname, error: 'Не вдалося зберегти файл' });
    }
  }

  res.status(201).json({ message: `Завантажено файлів: ${files.length}`, files, ...(errors.length ? { errors } : {}) });
}

export async function getFile(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор файлу');
  const file = await fileModel.findById(id);
  if (!file) throw new AppError(404, 'Файл не знайдено');
  res.sendFile(path.resolve(file.path));
}

export async function getMyFiles(req, res) {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { items, total } = await fileModel.findPage({ uploadedBy: req.user.userId }, { skip, take });
  res.json(paginate(items, total, { page, limit }));
}

export async function getConsultationFiles(req, res) {
  const consultationId = parseId(req.params.id, 'ідентифікатор консультації');
  const consultation = await consultationModel.findByIdCore(consultationId);
  if (!consultation) throw new AppError(404, 'Консультацію не знайдено');
  if (req.user.role !== 'ADMIN' && consultation.clientId !== req.user.userId && consultation.lawyerId !== req.user.userId) {
    throw new AppError(403, 'Лише учасники консультації бачать її файли');
  }
  res.json({ data: await fileModel.findAll({ consultationId }) });
}

export async function deleteFile(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор файлу');
  const file = await fileModel.findById(id);
  if (!file) throw new AppError(404, 'Файл не знайдено');

  if (file.uploadedBy !== req.user.userId && req.user.role !== 'ADMIN') {
    throw new AppError(403, 'Ви не маєте прав для видалення цього файлу');
  }

  await fileModel.remove(file.id);
  await fs.unlink(file.path).catch(() => {});

  res.json({ message: 'Файл успішно видалено' });
}
