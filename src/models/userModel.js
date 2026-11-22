import { prisma } from '../db.js';

const includeProfile = { lawyerProfile: { include: { specializations: true } } };

// Модель у MVC: усі Prisma-запити до таблиці User зібрані в одному місці
export const userModel = {
  findAll: (where) =>
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, include: includeProfile }),

  findById: (id) =>
    prisma.user.findUnique({
      where: { id },
      include: {
        ...includeProfile,
        _count: { select: { consultationsAsClient: true, consultationsAsLawyer: true } },
      },
    }),

  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),

  create: (data) => prisma.user.create({ data }),

  update: (id, data) => prisma.user.update({ where: { id }, data }),

  setRole: (id, role) => prisma.user.update({ where: { id }, data: { role } }),

  remove: (id) => prisma.user.delete({ where: { id } }),
};
