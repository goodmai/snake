import { z } from 'zod';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Try to load env from monorepo root first, then fallback to local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../../../.env');

// Do not load .env files during tests to keep unit tests isolated
// Also skip when VITEST is defined
const IS_TEST = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
if (!IS_TEST) {
  dotenv.config({ path: rootEnvPath });
  dotenv.config();
}

const common = {
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GAME_SHORT_NAME: z.string().min(1).default('snake_ts_senior'),
  LOG_LEVEL: z.enum(['info', 'warn', 'error', 'debug']).default('info'),
} as const;

const prodSchema = z.object({
  ...common,
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  GAME_URL: z.string().url('GAME_URL must be a valid URL'),
});

const testSchema = z.object({
  ...common,
  BOT_TOKEN: z.string().optional(),
  GAME_URL: z.string().url('GAME_URL must be a valid URL').default('http://localhost:3000'),
});

const envSchema = IS_TEST ? testSchema : prodSchema;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables.');
}

export const config = parsedEnv.data;

