export type GameMessageKey = { chat_id: number; message_id: number } | { inline_message_id: string };

import { getRedis } from './RedisClient.js';

const lastGameMessageByUser = new Map<number, GameMessageKey>();
const KEY_PREFIX = 'snake:lastGameMsg:';
const TTL_SECONDS = 24 * 60 * 60;

export async function setLastGameMessageForUser(userId: number, key: GameMessageKey): Promise<void> {
  const r = await getRedis();
  const value = JSON.stringify(key);
  if (r) {
    await r.set(KEY_PREFIX + userId, value, { EX: TTL_SECONDS });
  } else {
    lastGameMessageByUser.set(userId, key);
  }
}

export async function getLastGameMessageForUser(userId: number): Promise<GameMessageKey | undefined> {
  const r = await getRedis();
  if (r) {
    const v = await r.get(KEY_PREFIX + userId);
    return v ? JSON.parse(v) : undefined;
  }
  return lastGameMessageByUser.get(userId);
}

