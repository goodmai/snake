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
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  dotenv.config({ path: rootEnvPath });
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  GAME_SHORT_NAME: z.string().min(1).default('snake_ts_senior'),
  GAME_URL: z.string().url('GAME_URL must be a valid URL'),
  LOG_LEVEL: z.enum(['info', 'warn', 'error', 'debug']).default('info'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error('Invalid environment variables.');
}

export const config = parsedEnv.data;

