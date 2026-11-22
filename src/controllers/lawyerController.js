import { lawyerModel } from '../models/lawyerModel.js';
import { userModel } from '../models/userModel.js';
import { specializationModel } from '../models/specializationModel.js';
import { reviewModel } from '../models/reviewModel.js';
import { AppError } from '../utils/AppError.js';
import { assertValid } from '../utils/validate.js';
import { parseId } from '../utils/params.js';

const SORTABLE = ['rating', 'pricePerHour', 'experienceYears'];

export async function getLawyers(req, res) {
  const { specializationId, search, minPrice, maxPrice, sortBy = 'rating', order = 'desc' } = req.query;

  const where = {};
  if (specializationId) {
    where.specializations = { some: { id: parseId(specializationId, 'ідентифікатор спеціалізації') } };
  }
  if (search) {
    where.OR = [
      { bio: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.pricePerHour = {};
    if (minPrice !== undefined) where.pricePerHour.gte = Number(minPrice);
    if (maxPrice !== undefined) where.pricePerHour.lte = Number(maxPrice);
  }

  const lawyers = await lawyerModel.findAll({
    where,
    orderBy: { [SORTABLE.includes(sortBy) ? sortBy : 'rating']: order === 'asc' ? 'asc' : 'desc' },
  });
  res.json({ data: lawyers });
}

export async function getLawyerById(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор профілю юриста');
  const lawyer = await lawyerModel.findById(id);
  if (!lawyer) throw new AppError(404, 'Профіль юриста не знайдено');

  const [consultationsCount, reviews] = await Promise.all([
    lawyerModel.countConsultations(lawyer.userId),
    reviewModel.findByLawyer(lawyer.userId),
  ]);
  res.json({ data: { ...lawyer, consultationsCount, reviews } });
}

async function assertSpecializationsExist(specializationIds) {
  const found = await specializationModel.findByIds(specializationIds);
  if (found.length !== specializationIds.length) {
    throw new AppError(400, 'Частину спеціалізацій не знайдено', { specializationIds });
  }
}

export async function createLawyer(req, res) {
  assertValid(req.body, {
    userId: ['required', 'positiveInt'],
    bio: ['string', ['max', 2000]],
    experienceYears: ['nonNegativeInt'],
    pricePerHour: ['required', 'nonNegativeNumber'],
    isVerified: ['bool'],
    specializationIds: ['arrayOfPositiveInt'],
  });
  const {
    userId,
    bio,
    experienceYears = 0,
    pricePerHour,
    isVerified = false,
    specializationIds = [],
  } = req.body;

  const user = await userModel.findById(userId);
  if (!user) throw new AppError(404, 'Користувача не знайдено');

  const existing = await lawyerModel.findByUserId(userId);
  if (existing) throw new AppError(409, 'Профіль юриста для цього користувача вже існує');

  if (specializationIds.length > 0) await assertSpecializationsExist(specializationIds);

  const lawyer = await lawyerModel.create({
    userId,
    bio,
    experienceYears,
    pricePerHour,
    isVerified,
    specializations: { connect: specializationIds.map((id) => ({ id })) },
  });
  // користувач із профілем юриста отримує роль LAWYER
  await userModel.setRole(userId, 'LAWYER');

  res.status(201).json({ data: lawyer });
}

export async function updateLawyer(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор профілю юриста');
  assertValid(req.body, {
    bio: ['string', ['max', 2000]],
    experienceYears: ['nonNegativeInt'],
    pricePerHour: ['nonNegativeNumber'],
    isVerified: ['bool'],
    specializationIds: ['arrayOfPositiveInt'],
  });
  const { bio, experienceYears, pricePerHour, isVerified, specializationIds } = req.body ?? {};
  if ([bio, experienceYears, pricePerHour, isVerified, specializationIds].every((v) => v === undefined)) {
    throw new AppError(400, 'Не передано жодного поля для оновлення');
  }
  if (specializationIds && specializationIds.length > 0) {
    await assertSpecializationsExist(specializationIds);
  }
  const data = {};
  if (bio !== undefined) data.bio = bio;
  if (experienceYears !== undefined) data.experienceYears = experienceYears;
  if (pricePerHour !== undefined) data.pricePerHour = pricePerHour;
  if (isVerified !== undefined) data.isVerified = isVerified;
  if (specializationIds !== undefined) {
    data.specializations = { set: specializationIds.map((sid) => ({ id: sid })) };
  }

  const lawyer = await lawyerModel.update(id, data);
  res.json({ data: lawyer });
}

export async function deleteLawyer(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор профілю юриста');
  const lawyer = await lawyerModel.remove(id);
  // без профілю користувач знову стає клієнтом
  await userModel.setRole(lawyer.userId, 'CLIENT');
  res.status(204).end();
}
