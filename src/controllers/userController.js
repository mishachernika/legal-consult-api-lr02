import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { assertValid } from '../utils/validate.js';
import { parseId } from '../utils/params.js';

const ROLES = 'CLIENT,LAWYER,ADMIN';

export async function getUsers(req, res) {
  const { role } = req.query;
  if (role && !ROLES.split(',').includes(role)) {
    throw new AppError(400, 'Невідома роль', { role: [`допустимі значення: ${ROLES}`] });
  }
  const users = await userModel.findAll(role ? { role } : undefined);
  res.json({ data: users });
}

export async function getUserById(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор користувача');
  const user = await userModel.findById(id);
  if (!user) throw new AppError(404, 'Користувача не знайдено');
  res.json({ data: user });
}

export async function createUser(req, res) {
  assertValid(req.body, {
    email: ['required', 'email', ['max', 255]],
    name: ['required', 'string', ['min', 2], ['max', 100]],
    phone: ['string', ['max', 20]],
    role: [['enum', ROLES]],
  });
  const { email, name, phone, role } = req.body;

  const existing = await userModel.findByEmail(email);
  if (existing) throw new AppError(409, 'Користувач з таким email вже існує');

  const user = await userModel.create({ email, name, phone, role });
  res.status(201).json({ data: user });
}

export async function updateUser(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор користувача');
  assertValid(req.body, {
    email: ['email', ['max', 255]],
    name: ['string', ['min', 2], ['max', 100]],
    phone: ['string', ['max', 20]],
    role: [['enum', ROLES]],
  });
  const { email, name, phone, role } = req.body ?? {};
  if ([email, name, phone, role].every((v) => v === undefined)) {
    throw new AppError(400, 'Не передано жодного поля для оновлення');
  }
  if (email) {
    const existing = await userModel.findByEmail(email);
    if (existing && existing.id !== id) throw new AppError(409, 'Користувач з таким email вже існує');
  }
  const data = {};
  if (email !== undefined) data.email = email;
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (role !== undefined) data.role = role;

  const user = await userModel.update(id, data); // P2025 → 404
  res.json({ data: user });
}

export async function deleteUser(req, res) {
  const id = parseId(req.params.id, 'ідентифікатор користувача');
  await userModel.remove(id); // P2025 → 404, P2003 → 409
  res.status(204).end();
}
