import { Context } from 'telegraf';
import { logger } from '../core/Logger.js';

export class GameHandler {
  constructor(
    private readonly gameShortName: string,
    private readonly gameUrl: string,
  ) {}

  public onCallbackQuery(ctx: Context): void {
    const callbackQuery = (ctx as any).callbackQuery as any;

    if (callbackQuery?.game_short_name !== this.gameShortName) {
      ctx
        .answerCbQuery('Sorry, this game is not available.')
        .catch((e) => logger.error(e, 'Failed to answer unknown game query'));
      return;
    }

    // Сохраняем chat/message_id для дальнейшего обновления таблицы рекордов
    const cq: any = (ctx as any).callbackQuery;
    const from = cq?.from as { id: number } | undefined;
    if (from) {
      import('../core/SessionStore.js').then(({ setLastGameMessageForUser }) => {
        if (cq?.inline_message_id) {
          setLastGameMessageForUser(from.id, { inline_message_id: cq.inline_message_id });
        } else if (cq?.message?.chat?.id && cq?.message?.message_id) {
          setLastGameMessageForUser(from.id, { chat_id: cq.message.chat.id, message_id: cq.message.message_id });
        }
      }).catch((e) => logger.error(e, 'Failed to store game message mapping'));
    }

    (ctx as any)
      .answerCbQuery(undefined, { url: this.gameUrl })
      .catch((e: any) => logger.error(e, 'Failed to answer game callback query'));
  }

  public async onInlineQuery(ctx: Context): Promise<void> {
    try {
      const lang = (ctx.from as any)?.language_code || 'en';
      const q = (ctx.inlineQuery as any)?.query?.toLowerCase?.() || '';
      const isRu = q.includes('ru') || lang.startsWith('ru');

      // Base game inline result (native game tile)
      const gameResult = {
        type: 'game',
        id: 'snake-game',
        game_short_name: this.gameShortName,
      } as any;

      // Article variants with localized text and a Play button (first button MUST be callback_game)
      const articleRu = {
        type: 'article',
        id: 'snake-ru',
        title: 'Змейка — играть',
        description: 'Классическая игра Змейка. Управляйте свайпами или кнопками.',
        thumb_url: 'https://img.icons8.com/?size=100&id=114744&format=png',
        input_message_content: {
          message_text: 'Змейка (RU) — нажмите Играть, чтобы открыть игру.',
          parse_mode: 'HTML',
        },
        reply_markup: {
          inline_keyboard: [
            [{ callback_game: {}, text: '🎮 Играть' }],
            [{ text: 'English', switch_inline_query_current_chat: 'en' }],
          ],
        },
      } as any;

      const articleEn = {
        type: 'article',
        id: 'snake-en',
        title: 'Snake — play',
        description: 'Classic Snake game. Control with swipes or buttons.',
        thumb_url: 'https://img.icons8.com/?size=100&id=114744&format=png',
        input_message_content: {
          message_text: 'Snake (EN) — tap Play to open the game.',
          parse_mode: 'HTML',
        },
        reply_markup: {
          inline_keyboard: [
            [{ callback_game: {}, text: '🎮 Play' }],
            [{ text: 'Русский', switch_inline_query_current_chat: 'ru' }],
          ],
        },
      } as any;

      const results = isRu ? [gameResult, articleRu, articleEn] : [gameResult, articleEn, articleRu];

      await ctx.answerInlineQuery(results, { cache_time: 3600, is_personal: true });
    } catch (e) {
      logger.error(e, 'Failed to answer inline query');
    }
  }
}

