import { Telegraf } from 'telegraf';
import { logger } from './Logger.js';
import crypto from 'crypto';
import { config } from '../config/index.js';
import type { Application } from 'express';

// Простое in-memory хранилище рекордов: userId -> maxScore (fallback)
const topScores = new Map<number, number>();
const userNames = new Map<number, string>();

import { getRedis } from './RedisClient.js';
const ZSET_KEY = 'snake:highscores';
const USER_KEY = (id: number) => `snake:user:${id}`;

function validateInitData(initData: string): URLSearchParams | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(config.BOT_TOKEN)
    .digest();
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash === hash) {
    const userParams = params.get('user');
    return userParams ? new URLSearchParams(decodeURIComponent(userParams)) : null;
  }

  return null;
}

function extractUser(initData: string): { id: number; username?: string; first_name?: string; last_name?: string } | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    const decoded = decodeURIComponent(userStr);
    const user = JSON.parse(decoded);
    return { id: Number(user.id), username: user.username, first_name: user.first_name, last_name: user.last_name };
  } catch {
    return null;
  }
}

export function setupScoreHandling(app: Application, bot: Telegraf) {
  app.post('/score', async (req, res) => {
    const { score, initData } = req.body;

    if (typeof score !== 'number' || !initData) {
      return res.status(400).send('Invalid request body');
    }

    const valid = validateInitData(initData);
    if (!valid) {
      logger.warn('Invalid initData received. Possible tampering.');
      return res.status(403).send('Forbidden: Invalid data');
    }

    const userInfo = extractUser(initData);
    const userId = Number(userInfo?.id);
    if (!userId) {
      return res.status(400).send('User ID not found in initData');
    }

    const displayName = userInfo?.username ? `@${userInfo.username}` : [userInfo?.first_name, userInfo?.last_name].filter(Boolean).join(' ') || String(userId);
    
    logger.info(`Setting score for user ${userId} to ${score}`);
    
    // Сохраним имя пользователя
    try {
      const r = await getRedis();
      if (r && userInfo) {
        await r.hSet(USER_KEY(userId), {
          username: userInfo.username || '',
          first_name: userInfo.first_name || '',
          last_name: userInfo.last_name || '',
        });
      } else if (displayName) {
        userNames.set(userId, displayName);
      }
    } catch (e) {
      logger.error(e, 'Failed to store user info');
    }
    
    // ВАЖНО: Для таблиц рекордов в чатах/группах, нужно сохранять
    // chat_id/message_id или inline_message_id из первоначального CallbackQuery
    // и передавать их в setGameScore. Для простоты, мы используем глобальный
    // личный рекорд пользователя.
    // обновим локальную таблицу рекордов
    // persist score in Redis if available; fallback to memory
    try {
      const r = await getRedis();
      if (r) {
        // keep max score per user
        const existing = await r.zRangeWithScores(ZSET_KEY, 0, -1);
        const prev = existing.find((e: any) => String(e.value) === String(userId))?.score ?? -Infinity;
        if (score > prev) {
          await r.zAdd(ZSET_KEY, [{ score, value: String(userId) }]);
        }
      } else {
        const prev = topScores.get(userId) ?? 0;
        if (score > prev) topScores.set(userId, score);
      }
    } catch (e) {
      logger.error(e, 'Failed to persist score');
    }

    try {
      const { getLastGameMessageForUser } = await import('../core/SessionStore.js');
      const key = await getLastGameMessageForUser(userId);
      if (key) {
        if ('inline_message_id' in key) {
          await bot.telegram.setGameScore(userId, score, {
            inline_message_id: key.inline_message_id,
            edit_message: true,
          } as any);

          // Получим актуальную таблицу рекордов и обновим текст сообщения
          const highs = await bot.telegram.getGameHighScores(userId, {
            inline_message_id: key.inline_message_id,
          } as any);
          const lines = highs
            .slice(0, 10)
            .map((h, i) => {
              const name = h.user.username ? `@${h.user.username}` : [h.user.first_name, h.user.last_name].filter(Boolean).join(' ') || `${h.user.id}`;
              return `${i + 1}. ${name} — ${h.score}`;
            })
            .join('\n');
          const text = `🏆 Leaderboard\n${lines}`;
          await bot.telegram.editMessageText(undefined as any, undefined as any, key.inline_message_id, text, { parse_mode: 'HTML' } as any);
        } else {
          await bot.telegram.setGameScore(userId, score, {
            chat_id: key.chat_id,
            message_id: key.message_id,
            edit_message: true,
          } as any);

          const highs = await bot.telegram.getGameHighScores(userId, {
            chat_id: key.chat_id,
            message_id: key.message_id,
          } as any);
          const lines = highs
            .slice(0, 10)
            .map((h, i) => {
              const name = h.user.username ? `@${h.user.username}` : [h.user.first_name, h.user.last_name].filter(Boolean).join(' ') || `${h.user.id}`;
              return `${i + 1}. ${name} — ${h.score}`;
            })
            .join('\n');
          const text = `🏆 Leaderboard\n${lines}`;
          await bot.telegram.editMessageText(key.chat_id, key.message_id, undefined as any, text, { parse_mode: 'HTML' } as any);
        }
        return res.status(200).send('Score updated');
      }
      // fallback без редактирования сообщения
      await bot.telegram.setGameScore(userId, score, { disable_edit_message: true } as any);
      return res.status(200).send('Score updated');
    } catch (err) {
      logger.error(err, 'Failed to set game score');
      return res.status(200).send('Score stored locally');
    }
  });

  // Leaderboard with display names
  app.get('/leaderboard', async (_req, res) => {
    try {
      const r = await getRedis();
      const top: { userId: number; score: number; name: string }[] = [];
      if (r) {
        const entries = await r.zRangeWithScores(ZSET_KEY, -10, -1, { REV: true });
        for (const e of entries) {
          const uid = Number(e.value);
          const score = Math.floor(e.score);
          const u = await r.hGetAll(USER_KEY(uid));
          const name = u?.username ? `@${u.username}` : [u?.first_name, u?.last_name].filter(Boolean).join(' ') || String(uid);
          top.push({ userId: uid, score, name });
        }
      } else {
        const arr = Array.from(topScores.entries()).map(([userId, score]) => ({ userId, score }));
        arr.sort((a, b) => b.score - a.score).slice(0, 10).forEach(({ userId, score }) => {
          const name = userNames.get(userId) || String(userId);
          top.push({ userId, score, name });
        });
      }
      res.json(top);
    } catch (e) {
      logger.error(e, 'Failed to get leaderboard');
      res.status(500).json([]);
    }
  });
}

