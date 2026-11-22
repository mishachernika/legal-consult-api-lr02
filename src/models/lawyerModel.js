import { prisma } from '../db.js';

export const lawyerInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, role: true } },
  specializations: true,
};

// Модель профілю юриста: запити до LawyerProfile + пов'язаних даних
export const lawyerModel = {
  findAll: ({ where, orderBy }) =>
    prisma.lawyerProfile.findMany({ where, include: lawyerInclude, orderBy }),

  findById: (id) => prisma.lawyerProfile.findUnique({ where: { id }, include: lawyerInclude }),

  findByUserId: (userId) => prisma.lawyerProfile.findUnique({ where: { userId } }),

  create: (data) => prisma.lawyerProfile.create({ data, include: lawyerInclude }),

  update: (id, data) =>
    prisma.lawyerProfile.update({ where: { id }, data, include: lawyerInclude }),

  setRatingByUserId: (userId, rating) =>
    prisma.lawyerProfile.update({ where: { userId }, data: { rating } }),

  remove: (id) => prisma.lawyerProfile.delete({ where: { id } }),

  countConsultations: (lawyerUserId) =>
    prisma.consultation.count({ where: { lawyerId: lawyerUserId } }),
};
