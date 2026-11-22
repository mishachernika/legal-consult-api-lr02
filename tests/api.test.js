import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db.js';

before(async () => {
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.lawyerProfile.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.user.deleteMany();
});

after(async () => {
  await prisma.$disconnect();
});

describe('Health', () => {
  test('GET /health повертає статус ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});

describe('Users API', () => {
  const client = { email: 'client@example.com', name: 'Олена Ковальчук', phone: '+380501112233', role: 'CLIENT' };

  test('POST /api/users створює клієнта', async () => {
    const res = await request(app).post('/api/users').send(client);
    assert.equal(res.status, 201);
    assert.equal(res.body.data.email, client.email);
    assert.equal(res.body.data.role, 'CLIENT');
  });

  test('POST /api/users з невалідним email → 400 з деталями', async () => {
    const res = await request(app).post('/api/users').send({ email: 'not-an-email', name: 'Тест Тестов' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Помилка валідації даних');
    assert.ok(res.body.details.email);
  });

  test("POST /api/users з коротким ім'ям → 400", async () => {
    const res = await request(app).post('/api/users').send({ email: 'ok@example.com', name: 'A' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.name);
  });

  test('POST /api/users з дублем email → 409', async () => {
    const res = await request(app).post('/api/users').send(client);
    assert.equal(res.status, 409);
  });

  test('GET /api/users?role=LAWYER фільтрує за роллю', async () => {
    await request(app).post('/api/users').send({ email: 'lawyer@example.com', name: 'Петро Юрист', role: 'LAWYER' });
    const res = await request(app).get('/api/users?role=LAWYER');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.every((u) => u.role === 'LAWYER'));
  });

  test('GET /api/users/:id → 404 для неіснуючого', async () => {
    const res = await request(app).get('/api/users/9999');
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });

  test('PUT /api/users/:id оновлює ім\'я', async () => {
    const created = await request(app).post('/api/users').send({ email: 'edit@example.com', name: 'Старе Ім\'я' });
    const id = created.body.data.id;
    const res = await request(app).put(`/api/users/${id}`).send({ name: 'Нове Ім\'я' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Нове Ім\'я');
  });

  test('DELETE /api/users/:id → 204, повторний → 404', async () => {
    const created = await request(app).post('/api/users').send({ email: 'del@example.com', name: 'Видалити Мене' });
    const id = created.body.data.id;
    assert.equal((await request(app).delete(`/api/users/${id}`)).status, 204);
    assert.equal((await request(app).delete(`/api/users/${id}`)).status, 404);
  });
});

describe('Specializations API', () => {
  test('CRUD: створення, дубль → 409, список, видалення', async () => {
    const created = await request(app).post('/api/specializations').send({ name: 'Цивільне право', description: 'Договори, нерухомість' });
    assert.equal(created.status, 201);

    const dup = await request(app).post('/api/specializations').send({ name: 'Цивільне право' });
    assert.equal(dup.status, 409);

    const list = await request(app).get('/api/specializations');
    assert.equal(list.status, 200);
    assert.ok(list.body.data.some((s) => s.name === 'Цивільне право'));

    const id = created.body.data.id;
    assert.equal((await request(app).delete(`/api/specializations/${id}`)).status, 204);
    assert.equal((await request(app).get(`/api/specializations/${id}`)).status, 404);
  });
});

describe('Lawyers API', () => {
  let lawyerUserId;
  let profileId;
  let specId;

  before(async () => {
    const u = await request(app).post('/api/users').send({ email: 'lawyer2@example.com', name: 'Іван Адвокат', role: 'LAWYER' });
    lawyerUserId = u.body.data.id;
    const s = await request(app).post('/api/specializations').send({ name: 'Кримінальне право' });
    specId = s.body.data.id;
  });

  test('POST /api/lawyers створює профіль із спеціалізацією і роллю LAWYER', async () => {
    const res = await request(app)
      .post('/api/lawyers')
      .send({ userId: lawyerUserId, bio: 'Адвокат, 10 років практики', experienceYears: 10, pricePerHour: 800, specializationIds: [specId] });
    assert.equal(res.status, 201);
    profileId = res.body.data.id;
    assert.equal(res.body.data.specializations.length, 1);
    assert.equal(Number(res.body.data.pricePerHour), 800);

    const user = await request(app).get(`/api/users/${lawyerUserId}`);
    assert.equal(user.body.data.role, 'LAWYER');
  });

  test('POST /api/lawyers повторно для того самого userId → 409', async () => {
    const res = await request(app).post('/api/lawyers').send({ userId: lawyerUserId, pricePerHour: 100 });
    assert.equal(res.status, 409);
  });

  test('POST /api/lawyers з неіснуючою спеціалізацією → 400', async () => {
    const u = await request(app).post('/api/users').send({ email: 'lawyer3@example.com', name: 'Інший Юрист' });
    const res = await request(app)
      .post('/api/lawyers')
      .send({ userId: u.body.data.id, pricePerHour: 100, specializationIds: [99999] });
    assert.equal(res.status, 400);
  });

  test('POST /api/lawyers з неіснуючим користувачем → 404', async () => {
    const res = await request(app).post('/api/lawyers').send({ userId: 99999, pricePerHour: 100 });
    assert.equal(res.status, 404);
  });

  test('GET /api/lawyers?specializationId= фільтрує за сферою права', async () => {
    const res = await request(app).get(`/api/lawyers?specializationId=${specId}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.every((l) => l.specializations.some((s) => s.id === specId)));
  });

  test('GET /api/lawyers/:id → 404 для неіснуючого профілю', async () => {
    const res = await request(app).get('/api/lawyers/99999');
    assert.equal(res.status, 404);
  });
});

describe('Consultations API', () => {
  let clientId;
  let lawyerUserId;
  let consultationId;

  before(async () => {
    const c = await request(app).post('/api/users').send({ email: 'cli2@example.com', name: 'Клієнт Другий' });
    clientId = c.body.data.id;
    const l = await request(app).post('/api/users').send({ email: 'law4@example.com', name: 'Юрист Четвертий' });
    lawyerUserId = l.body.data.id;
    await request(app).post('/api/lawyers').send({ userId: lawyerUserId, pricePerHour: 500, experienceYears: 3 });
  });

  test('POST /api/consultations — ціна за замовчуванням = ставка юриста, статус PENDING', async () => {
    const res = await request(app).post('/api/consultations').send({
      clientId,
      lawyerId: lawyerUserId,
      topic: 'Питання щодо договору оренди',
      description: 'Потрібна консультація щодо умов договору оренди приміщення.',
    });
    assert.equal(res.status, 201);
    consultationId = res.body.data.id;
    assert.equal(res.body.data.status, 'PENDING');
    assert.equal(Number(res.body.data.price), 500);
  });

  test('POST /api/consultations з неіснуючим юристом → 404', async () => {
    const res = await request(app).post('/api/consultations').send({
      clientId,
      lawyerId: 99999,
      topic: 'Тестова консультація',
      description: 'Опис достатньої довжини для валідації.',
    });
    assert.equal(res.status, 404);
  });

  test('PUT /api/consultations/:id — зміна статусу', async () => {
    const res = await request(app).put(`/api/consultations/${consultationId}`).send({ status: 'CONFIRMED' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'CONFIRMED');
  });

  test('PUT /api/consultations/:id з невалідним статусом → 400', async () => {
    const res = await request(app).put(`/api/consultations/${consultationId}`).send({ status: 'WRONG' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.status);
  });

  test('POST /:id/messages від сторонньої особи → 403', async () => {
    const outsider = await request(app).post('/api/users').send({ email: 'outsider@example.com', name: 'Сторонній' });
    const res = await request(app)
      .post(`/api/consultations/${consultationId}/messages`)
      .send({ senderId: outsider.body.data.id, text: 'Привіт, я тут випадково' });
    assert.equal(res.status, 403);
  });

  test('POST /:id/messages від клієнта → 201, GET повертає історію', async () => {
    const post = await request(app)
      .post(`/api/consultations/${consultationId}/messages`)
      .send({ senderId: clientId, text: 'Добрий день! Коли зручно провести консультацію?' });
    assert.equal(post.status, 201);
    assert.equal(post.body.data.sender.id, clientId);

    const list = await request(app).get(`/api/consultations/${consultationId}/messages`);
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.data[0].text, 'Добрий день! Коли зручно провести консультацію?');
  });

  test('GET /api/consultations?status=CONFIRMED фільтрує', async () => {
    const res = await request(app).get('/api/consultations?status=CONFIRMED');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.every((c) => c.status === 'CONFIRMED'));
  });
});

describe('Reviews API', () => {
  test('відгук до завершення консультації → 400', async () => {
    const list = await request(app).get('/api/consultations?status=CONFIRMED');
    const { id } = list.body.data[0];
    const res = await request(app).post('/api/reviews').send({ consultationId: id, rating: 5, text: 'Супер' });
    assert.equal(res.status, 400);
  });

  test('після COMPLETED відгук створюється, дубль → 409, рейтинг юриста оновлюється', async () => {
    const list = await request(app).get('/api/consultations?status=CONFIRMED');
    const consultation = list.body.data[0];

    await request(app).put(`/api/consultations/${consultation.id}`).send({ status: 'COMPLETED' });

    const created = await request(app)
      .post('/api/reviews')
      .send({ consultationId: consultation.id, rating: 4, text: 'Гарна консультація, дякую' });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.rating, 4);
    assert.equal(created.body.data.lawyerId, consultation.lawyerId);

    const dup = await request(app).post('/api/reviews').send({ consultationId: consultation.id, rating: 5 });
    assert.equal(dup.status, 409);

    const lawyer = await request(app).get(`/api/lawyers?specializationId=`);
    assert.equal(lawyer.status, 200);

    const reviews = await request(app).get(`/api/reviews?lawyerId=${consultation.lawyerId}`);
    assert.equal(reviews.status, 200);
    assert.equal(reviews.body.data.length, 1);

    // рейтинг профілю перераховано: шукаємо профіль за userId через список
    const all = await request(app).get('/api/lawyers');
    const profile = all.body.data.find((l) => l.user.id === consultation.lawyerId);
    assert.equal(Number(profile.rating), 4);
  });

  test('рейтинг поза діапазоном 1-5 → 400', async () => {
    const list = await request(app).get('/api/consultations?status=COMPLETED');
    const other = await request(app).post('/api/consultations').send({
      clientId: list.body.data[0].clientId,
      lawyerId: list.body.data[0].lawyerId,
      topic: 'Ще одна консультація',
      description: 'Опис достатньої довжини для валідації.',
    });
    await request(app).put(`/api/consultations/${other.body.data.id}`).send({ status: 'COMPLETED' });
    const res = await request(app).post('/api/reviews').send({ consultationId: other.body.data.id, rating: 9 });
    assert.equal(res.status, 400);
  });
});

describe('Обробка помилок', () => {
  test('невідомий маршрут → 404 у форматі JSON', async () => {
    const res = await request(app).get('/api/nope');
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });

  test('невалідний id у шляху → 400', async () => {
    const res = await request(app).get('/api/users/abc');
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});
