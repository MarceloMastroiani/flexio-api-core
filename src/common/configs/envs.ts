import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config();

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  CORS_ORIGIN: string;
  BUSINESS_TIMEZONE: string;
  CANCELLATION_CUTOFF_HOURS: number;
}

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';
const DEFAULT_CANCELLATION_CUTOFF_HOURS = 2;

const envsSchema = Joi.object({
  PORT: Joi.number().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().email().required(),
  CORS_ORIGIN: Joi.string().required(),
  BUSINESS_TIMEZONE: Joi.string().default(DEFAULT_TIMEZONE),
  CANCELLATION_CUTOFF_HOURS: Joi.number()
    .min(0)
    .default(DEFAULT_CANCELLATION_CUTOFF_HOURS),
}).unknown(true);

const result = envsSchema.validate(process.env);

if (result.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envsVars = result.value as EnvVars;

export const envs = {
  port: envsVars.PORT,
  databaseUrl: envsVars.DATABASE_URL,
  jwtSecret: envsVars.JWT_SECRET,
  resendApiKey: envsVars.RESEND_API_KEY,
  resendFromEmail: envsVars.RESEND_FROM_EMAIL,
  corsOrigin: envsVars.CORS_ORIGIN,
  businessTimezone: envsVars.BUSINESS_TIMEZONE,
  cancellationCutoffHours: envsVars.CANCELLATION_CUTOFF_HOURS,
};
