import 'dotenv/config';
import * as Joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  CORS_ORIGIN: string;
}

const envsSchema = Joi.object({
  PORT: Joi.number().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().email().required(),
  CORS_ORIGIN: Joi.string().required(),
}).unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: \${error.message}`);
}

const envsVars: EnvVars = value;

export const envs = {
  port: envsVars.PORT,
  databaseUrl: envsVars.DATABASE_URL,
  jwtSecret: envsVars.JWT_SECRET,
  resendApiKey: envsVars.RESEND_API_KEY,
  resendFromEmail: envsVars.RESEND_FROM_EMAIL,
  corsOrigin: envsVars.CORS_ORIGIN,
};
