import { Telegraf } from 'telegraf';
import { logger } from './Logger.js';
import crypto from 'crypto';
import { config } from '../config/index.js';
import type { Application } from 'express';

// Простое in-memory хранилище рекордов: userId -> maxScore
const topScores = new Map<number, number>();

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

export function setupScoreHandling(app: Application, bot: Telegraf) {
  app.post('/score', async (req, res) => {
    const { score, initData } = req.body;

    if (typeof score !== 'number' || !initData) {
      return res.status(400).send('Invalid request body');
    }

    const userParams = validateInitData(initData);
    if (!userParams) {
      logger.warn('Invalid initData received. Possible tampering.');
      return res.status(403).send('Forbidden: Invalid data');
    }

    const userId = Number(userParams.get('id'));
    if (!userId) {
      return res.status(400).send('User ID not found in initData');
    }
    
    logger.info(`Setting score for user ${userId} to ${score}`);
    
    // ВАЖНО: Для таблиц рекордов в чатах/группах, нужно сохранять
    // chat_id/message_id или inline_message_id из первоначального CallbackQuery
    // и передавать их в setGameScore. Для простоты, мы используем глобальный
    // личный рекорд пользователя.
    // обновим локальную таблицу рекордов
    const prev = topScores.get(userId) ?? 0;
    if (score > prev) topScores.set(userId, score);

    try {
      const { getLastGameMessageForUser } = await import('../core/SessionStore.js');
      const key = getLastGameMessageForUser(userId);
      if (key) {
        if ('inline_message_id' in key) {
          await bot.telegram.setGameScore(userId, score, {
            inline_message_id: key.inline_message_id,
            edit_message: true,
          } as any);
        } else {
          await bot.telegram.setGameScore(userId, score, {
            chat_id: key.chat_id,
            message_id: key.message_id,
            edit_message: true,
          } as any);
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

}

