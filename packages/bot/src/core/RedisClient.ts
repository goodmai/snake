import { createClient } from 'redis';
import { logger } from './Logger.js';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedis(): Promise<typeof client> {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = createClient({ url });
  client.on('error', (err) => logger.error(err, 'Redis Client Error'));
  await client.connect();
  return client;
}
