import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(404, `Маршрут не знайдено: ${req.method} ${req.originalUrl}`));
}

// Централізований обробник помилок: у Express 5 помилки з async-обробників потрапляють сюди самі
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  }

  // Помилки Prisma
  if (err?.code === 'P2002') {
    return res.status(409).json({
      error: 'Запис з такими унікальними даними вже існує',
      details: err.meta?.target,
    });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Запис не знайдено' });
  }
  if (err?.code === 'P2003') {
    return res.status(409).json({ error: 'Неможливо видалити запис: з ним пов\'язані інші дані' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Невалідний JSON у тілі запиту' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Внутрішня помилка сервера' });
}
