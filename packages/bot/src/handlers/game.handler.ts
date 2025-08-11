import { Context } from 'telegraf';
import { CallbackQuery } from 'telegraf/types';
import { logger } from '../core/Logger.js';

export class GameHandler {
  constructor(
    private readonly gameShortName: string,
    private readonly gameUrl: string,
  ) {}

  public onCallbackQuery(ctx: Context): void {
    const callbackQuery =
      ctx.callbackQuery as CallbackQuery.GameShortNameCallbackQuery;

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

    ctx
      .answerCbQuery(undefined, { url: this.gameUrl })
      .catch((e) => logger.error(e, 'Failed to answer game callback query'));
  }

  public async onInlineQuery(ctx: Context): Promise<void> {
    try {
      const results = [
        {
          type: 'game',
          id: 'snake-game-1',
          game_short_name: this.gameShortName,
        },
      ] as any;
      await ctx.answerInlineQuery(results, { cache_time: 0 });
    } catch (e) {
      logger.error(e, 'Failed to answer inline query');
    }
  }
}

