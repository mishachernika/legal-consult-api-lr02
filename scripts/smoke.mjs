// Smoke-тест API проти запущеного сервера: node scripts/smoke.mjs (порт із PORT або 3000)
const BASE = `http://localhost:${process.env.PORT || 3000}`;

let passed = 0;
let failed = 0;

function check(name, cond) {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}`);
  }
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* не JSON (наприклад, 204) */
  }
  return { status: res.status, body: data };
}

async function main() {
  console.log(`Smoke-тест проти ${BASE}\n`);

  const health = await req('GET', '/health');
  check('GET /health → 200 ok', health.status === 200 && health.body.status === 'ok');

  const lawyers = await req('GET', '/api/lawyers?sortBy=pricePerHour&order=asc');
  check('GET /api/lawyers → список, відсортований за ціною', lawyers.status === 200 && lawyers.body.data.length >= 3);
  const lawyer = lawyers.body.data[0];
  console.log(`  перший у списку: ${lawyer.user.name}, ${Number(lawyer.pricePerHour)} грн/год, сфер: ${lawyer.specializations.length}`);

  const specs = await req('GET', '/api/specializations');
  check('GET /api/specializations → довідник сфер права', specs.status === 200 && specs.body.data.length >= 5);

  const suffix = Date.now();
  const client = await req('POST', '/api/users', {
    email: `smoke.${suffix}@example.com`,
    name: 'Smoke Тестовий',
    role: 'CLIENT',
  });
  check('POST /api/users → 201', client.status === 201);
  const clientId = client.body.data.id;

  const outsider = await req('POST', '/api/users', { email: `out.${suffix}@example.com`, name: 'Сторонній' });
  const outsiderId = outsider.body.data.id;

  const cons = await req('POST', '/api/consultations', {
    clientId,
    lawyerId: lawyer.user.id,
    topic: 'Smoke: перевірка договору',
    description: 'Потрібна консультація щодо умов договору поставки товару.',
  });
  check('POST /api/consultations → 201, ціна = ставка юриста', cons.status === 201 && Number(cons.body.data.price) === Number(lawyer.pricePerHour));
  const consId = cons.body.data.id;
  check('  статус нової консультації PENDING', cons.body.data.status === 'PENDING');

  const upd = await req('PUT', `/api/consultations/${consId}`, { status: 'CONFIRMED' });
  check('PUT /api/consultations/:id → статус CONFIRMED', upd.status === 200 && upd.body.data.status === 'CONFIRMED');

  const badStatus = await req('PUT', `/api/consultations/${consId}`, { status: 'WRONG' });
  check('PUT з невалідним статусом → 400', badStatus.status === 400 && !!badStatus.body.details?.status);

  const msg = await req('POST', `/api/consultations/${consId}/messages`, { senderId: clientId, text: 'Добрий день!' });
  check('POST /:id/messages від клієнта → 201', msg.status === 201);

  const msgOut = await req('POST', `/api/consultations/${consId}/messages`, { senderId: outsiderId, text: 'Я тут випадково' });
  check('POST /:id/messages від стороннього → 403', msgOut.status === 403);

  await req('PUT', `/api/consultations/${consId}`, { status: 'COMPLETED' });
  const early = await req('POST', '/api/reviews', { consultationId: consId, rating: 5 });
  check('POST /api/reviews після COMPLETED → 201', early.status === 201);
  const dup = await req('POST', '/api/reviews', { consultationId: consId, rating: 4 });
  check('дубль відгуку → 409', dup.status === 409);

  const profile = await req('GET', `/api/lawyers/${lawyer.id}`);
  check('GET /api/lawyers/:id → рейтинг перераховано', profile.status === 200 && Number(profile.body.data.rating) === 5);

  const badUser = await req('POST', '/api/users', { email: 'not-an-email', name: 'A' });
  check('POST /api/users з невалідними даними → 400 з деталями', badUser.status === 400 && !!badUser.body.details?.email);

  const notFound = await req('GET', '/api/nope');
  check('невідомий маршрут → 404 JSON', notFound.status === 404 && !!notFound.body.error);

  const badId = await req('GET', '/api/users/abc');
  check('невалідний id → 400', badId.status === 400);

  // прибирання за собою у демо-базі
  await req('DELETE', `/api/reviews/${early.body.data.id}`);
  await req('DELETE', `/api/consultations/${consId}`);
  await req('DELETE', `/api/users/${clientId}`);
  await req('DELETE', `/api/users/${outsiderId}`);

  console.log(`\nРазом: ${passed} пройдено, ${failed} провалено`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
