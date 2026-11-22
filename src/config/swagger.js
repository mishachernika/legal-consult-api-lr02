import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Legal Consult API',
      version: '1.0.0',
      description:
        'REST API онлайн-платформи юридичних консультацій. ' +
        'Клієнти створюють запити на консультації, спілкуються з юристом у чаті та залишають відгуки.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Локальний сервер розробки' }],
    tags: [
      { name: 'Health', description: 'Стан сервера' },
      { name: 'Users', description: 'Користувачі платформи (клієнти, юристи, адміністратори)' },
      { name: 'Lawyers', description: 'Профілі юристів та їхні сфери права' },
      { name: 'Specializations', description: 'Сфери права (довідник)' },
      { name: 'Consultations', description: 'Консультації та чати між клієнтом і юристом' },
      { name: 'Reviews', description: 'Відгуки клієнтів про завершені консультації' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Помилка валідації даних' },
            details: { type: 'object' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpecs = swaggerJsdoc(options);
