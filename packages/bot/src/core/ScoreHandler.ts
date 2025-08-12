import { Telegraf } from 'telegraf';
import { logger } from './Logger.js';
import crypto from 'crypto';
import { config } from '../config/index.js';
import type { Application } from 'express';
import { eventBus } from './EventBus.js';

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
  // lightweight logging endpoint to receive client events (e.g., food spawn/eat)
  app.post('/log', (req, res) => {
    // Accept generic log payloads from clients
    try {
      const { event, payload } = req.body || {};
      logger.info({ event, payload }, 'Client log event');
      eventBus.emitEvent({ type: 'log', payload: { event, payload } });
    } catch (e) {
      logger.warn(e, 'Failed to parse client log event');
    }
    res.status(204).end();
  });

  // Explicit endpoint to report food spawn (position/color) from clients
  app.post('/food-spawn', (req, res) => {
    try {
      const { x, y, color } = req.body || {};
      if (typeof x === 'number' && typeof y === 'number' && typeof color === 'string') {
        logger.info({ x, y, color }, 'Food spawn');
        eventBus.emitEvent({ type: 'food-spawn', payload: { x, y, color } });
        return res.status(204).end();
      }
      return res.status(400).send('Bad payload');
    } catch (e) {
      logger.warn(e, 'Failed to handle food-spawn');
      res.status(400).send('Bad payload');
    }
  });

  // Server-Sent Events stream for diagnostics
  app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const send = (evt: any) => {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    };
    const unsubscribe = eventBus.onEvent(send);
    req.on('close', () => unsubscribe());
  });

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
    
    logger.info({ userId, score }, 'Setting user score');
    
    // Сохраним имя пользователя
    try {
      const r = await getRedis();
      if (r && userInfo) {
        logger.info({ userId, userInfo }, 'Storing user profile');
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
          logger.info({ userId, score }, 'Updated Redis ZSET highscore');
          eventBus.emitEvent({ type: 'score', payload: { userId, score } });
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
          await (bot.telegram as any).setGameScore(userId, score, {
            inline_message_id: key.inline_message_id,
            edit_message: true,
          });

          // Получим актуальную таблицу рекордов и обновим текст сообщения
          const highs = await (bot.telegram as any).getGameHighScores(userId, {
            inline_message_id: key.inline_message_id,
          });
          const lines = highs
            .slice(0, 10)
.map((h: any, i: number) => {
              const name = h.user.username ? `@${h.user.username}` : [h.user.first_name, h.user.last_name].filter(Boolean).join(' ') || `${h.user.id}`;
              return `${i + 1}. ${name} — ${h.score}`;
            })
            .join('\n');
          const text = `🏆 Leaderboard\n${lines}`;
          await (bot.telegram as any).editMessageText(undefined, undefined, key.inline_message_id, text, { parse_mode: 'HTML' });
        } else {
          await (bot.telegram as any).setGameScore(userId, score, {
            chat_id: key.chat_id,
            message_id: key.message_id,
            edit_message: true,
          });

          const highs = await (bot.telegram as any).getGameHighScores(userId, {
            chat_id: key.chat_id,
            message_id: key.message_id,
          });
          const lines = highs
            .slice(0, 10)
.map((h: any, i: number) => {
              const name = h.user.username ? `@${h.user.username}` : [h.user.first_name, h.user.last_name].filter(Boolean).join(' ') || `${h.user.id}`;
              return `${i + 1}. ${name} — ${h.score}`;
            })
            .join('\n');
          const text = `🏆 Leaderboard\n${lines}`;
          await (bot.telegram as any).editMessageText(key.chat_id, key.message_id, undefined, text, { parse_mode: 'HTML' });
        }
        return res.status(200).send('Score updated');
      }
      // fallback без редактирования сообщения
      await (bot.telegram as any).setGameScore(userId, score, { disable_edit_message: true });
      return res.status(200).send('Score updated');
    } catch (err) {
      logger.error(err, 'Failed to set game score');
      return res.status(200).send('Score stored locally');
    }
  });

  // Read profile of a user
  app.get('/user/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).send('Bad id');
      const r = await getRedis();
      if (r) {
        const u = await r.hGetAll(USER_KEY(id));
        return res.json(u || {});
      }
      return res.json({});
    } catch (e) {
      logger.error(e, 'Failed to get user');
      res.status(500).json({});
    }
  });

  // Read single user score
  app.get('/scores/:id', async (req, res) => {
    try {
      const id = String(Number(req.params.id));
      const r = await getRedis();
      if (!r) return res.json({ score: 0 });
      const entries = await r.zRangeWithScores(ZSET_KEY, 0, -1);
      const found = entries.find((e: any) => e.value === id);
      return res.json({ score: found ? Math.floor(found.score) : 0 });
    } catch (e) {
      logger.error(e, 'Failed to get score');
      res.status(500).json({ score: 0 });
    }
  });

  // Leaderboard with display names
  app.get('/leaderboard', async (_req, res) => {
    try {
      const r = await getRedis();
      const top: { userId: number; score: number; name: string }[] = [];
      if (r) {
        const entries = await r.zRangeWithScores(ZSET_KEY, -10, -1, { REV: true });
        logger.info({ count: entries.length }, 'Fetched highscores from Redis');
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

