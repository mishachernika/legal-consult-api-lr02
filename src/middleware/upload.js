import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
fs.mkdirSync(uploadDir, { recursive: true });

// Дозволені типи: MIME-тип і розширення мають збігатися (обидва легко підробити, тому перевіряємо разом)
const allowedTypes = new Map([
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['image/gif', ['.gif']],
  ['image/webp', ['.webp']],
  ['application/pdf', ['.pdf']],
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // оригінальне ім'я ніколи не використовуємо як шлях на диску
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.get(file.mimetype)?.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Непідтримуваний тип файлу (дозволено: jpg, png, gif, webp, pdf)');
    error.status = 400;
    cb(error);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
    files: 5,
  },
});
