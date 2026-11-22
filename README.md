# Лабораторна робота 01 Розроблення backend архітектури та основного функціоналу
## Автор

Чернік Михайло Богданович, група ІПЗ-41, Волинський фаховий коледж НУХТ

REST API **онлайн-платформи юридичних консультацій**: клієнт вибирає юриста за сферою права, замовляє консультацію, листується з юристом у чаті й після завершення лишає відгук з оцінкою.

Зроблено на Node.js 24 + Express 5, дані зберігаються в PostgreSQL (доступ через Prisma 7), документація API — Swagger на `/api-docs`.

## Що вже вміє API

- користувачі з ролями (`CLIENT`, `LAWYER`, `ADMIN`);
- каталог юристів: профіль, сфери права, ставка за годину, середній рейтинг;
- консультації зі статусами `PENDING → CONFIRMED → IN_PROGRESS → COMPLETED / CANCELLED` (якщо ціну не вказати — береться ставка юриста);
- чат у межах консультації — писати можуть лише її учасники (клієнт і юрист), стороннім API повертає 403;
- відгук можна лишити лише після завершення консультації, і лише один на консультацію; рейтинг юриста перераховується автоматично;
- валідація всіх вхідних даних і помилки у форматі `{ "error": "...", "details": {...} }`;
- документація Swagger — прямо в браузері на `/api-docs`.

## Стек

Node.js 24 (ES-модулі) · Express 5 · PostgreSQL · Prisma 7 · Swagger (swagger-jsdoc + swagger-ui-express) · helmet + cors · тести на вбудованому `node:test` + supertest.

## База даних

6 таблиць: `User`, `LawyerProfile`, `Specialization`, `Consultation`, `Message`, `Review`. Зв'язки один-до-багатьох (користувач ↔ консультації, консультація ↔ чат/відгук) і багато-до-багатьох (юрист ↔ сфери права). Зовнішні ключі задані через `@relation`, є індекси на полях фільтрів.

```mermaid
erDiagram
    User ||--o{ Consultation : "як клієнт"
    User ||--o{ Consultation : "як юрист"
    User ||--o| LawyerProfile : "має профіль"
    User ||--o{ Message : "надсилає"
    User ||--o{ Review : "залишає / отримує"
    LawyerProfile }o--o{ Specialization : "має сфери права"
    Consultation ||--o{ Message : "містить чат"
    Consultation ||--o| Review : "має відгук"
```

## Як запустити у себе

Потрібні Node.js 24 і PostgreSQL.

```bash
git clone https://github.com/mishachernika/legal-consult-api.git
cd legal-consult-api
npm install

cp .env.example .env          # вказати свій DATABASE_URL
cp .env.test.example .env.test # для тестів

npm run db:migrate            # створити таблиці
npm run db:seed               # демо-дані: юристи, клієнти, консультації, чат, відгук
npm run dev                   # сервер з автоперезапуском
```

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`
- health-check: `GET /health`

## Змінні середовища

| Змінна | Навіщо | Приклад |
|---|---|---|
| `DATABASE_URL` | підключення до PostgreSQL | `postgresql://user:pass@localhost:5432/legal_consult` |
| `PORT` | порт сервера | `3000` |
| `FRONTEND_URL` | origin фронтенду для CORS | `http://localhost:5173` |

`.env` і `.env.test` не лежать у репозиторії — тільки шаблони `.env.example` / `.env.test.example`.

## Ендпоінти

| Метод | Шлях | Що робить |
|---|---|---|
| GET | `/health` | стан сервера |
| GET, POST | `/api/users` | список (`?role=`) / створити користувача |
| GET, PUT, DELETE | `/api/users/:id` | картка / оновити / видалити |
| GET, POST | `/api/lawyers` | список із фільтрами і сортуванням (`?specializationId=&search=&minPrice=&maxPrice=&sortBy=&order=`) / створити профіль |
| GET, PUT, DELETE | `/api/lawyers/:id` | профіль із відгуками / оновити / видалити |
| GET | `/api/lawyers/:id/reviews` | відгуки про юриста |
| GET, POST | `/api/specializations` | довідник сфер права |
| GET, PUT, DELETE | `/api/specializations/:id` | картка сфери зі списком юристів |
| GET, POST | `/api/consultations` | список (`?clientId=&lawyerId=&status=`) / новий запит |
| GET, PUT, DELETE | `/api/consultations/:id` | картка з чатом і відгуком / змінити (у т.ч. статус) / видалити |
| GET, POST | `/api/consultations/:id/messages` | чат консультації |
| GET, POST | `/api/reviews` | список відгуків (`?lawyerId=&clientId=&minRating=`) / лишити відгук |
| GET, PUT, DELETE | `/api/reviews/:id` | картка / оновити / видалити відгук |

Детальні описи з прикладами — у Swagger UI.

## Тести та перевірка

```bash
npm test                  # 28 інтеграційних тестів проти окремої тестової БД
node scripts/smoke.mjs    # 16 smoke-перевірок проти запущеного сервера
bash scripts/curl-demo.sh # curl-приклади наживо
```

Звіт з ЛР01 — у `reports/lab1-report.md`.

## Скріншоти

Swagger UI на `/api-docs`:

![Swagger UI](reports/screenshots/swagger-ui.png)

ER-діаграма бази даних:

![ER-діаграма](reports/screenshots/er-diagram.png)

`npm test` у терміналі (28/28):

![npm test](reports/screenshots/terminal-npm-test.png)

Smoke-тест наживо, 16/16:

![smoke](reports/screenshots/terminal-smoke.png)

curl-запити до API:

![curl](reports/screenshots/terminal-curl.png)

## Структура проєкту

```
├── prisma/                  # schema.prisma, міграції, seed
├── src/
│   ├── models/              # шар моделей: усі запити до БД (MVC Model)
│   ├── controllers/         # тонкі контролери: валідація + правила + відповіді
│   ├── routes/              # маршрути + JSDoc для Swagger
│   ├── middleware/          # централізована обробка помилок
│   ├── utils/               # валідація, AppError, parseId
│   ├── config/              # swagger
│   ├── app.js               # збирання застосунку (без listen)
│   ├── server.js            # запуск сервера
│   └── db.js                # єдиний екземпляр PrismaClient
├── tests/api.test.js        # інтеграційні тести API
├── scripts/                 # smoke.mjs, curl-demo.sh
├── reports/                 # звіти лабораторних + скріншоти
└── .github/workflows/       # CI: тести на кожен push (Node 24 + PostgreSQL 17)
```


