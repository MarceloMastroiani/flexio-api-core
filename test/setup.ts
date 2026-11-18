import { config } from 'dotenv';

// Carga las variables del .env (no pisa las que ya están definidas).
config();

// Valores por defecto para que la validación de Joi (src/common/configs/envs.ts)
// no falle al importar módulos en los tests, sin depender de un .env real.
const defaults: Record<string, string> = {
  PORT: '3000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/flexio_test',
  JWT_SECRET: 'test-secret',
  RESEND_API_KEY: 're_test_123',
  RESEND_FROM_EMAIL: 'onboarding@resend.dev',
  CORS_ORIGIN: 'http://localhost:5173',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
