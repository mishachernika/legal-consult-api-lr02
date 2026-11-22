import { prisma } from '../db.js';

export const fileModel = {
  create: (data) => prisma.file.create({ data }),

  findById: (id) => prisma.file.findUnique({ where: { id } }),

  findAll: (where) =>
    prisma.file.findMany({ where, orderBy: { createdAt: 'desc' } }),

  findPage: async (where, { skip, take, orderBy = { createdAt: 'desc' } }) => {
    const [items, total] = await Promise.all([
      prisma.file.findMany({ where, skip, take, orderBy }),
      prisma.file.count({ where }),
    ]);
    return { items, total };
  },

  remove: (id) => prisma.file.delete({ where: { id } }),
};
