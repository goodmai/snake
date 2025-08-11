import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';
import { CommandHandler } from '../handlers/command.handler.js';
import { GameHandler } from '../handlers/game.handler.js';
import { logger } from './Logger.js';
import { config } from '../config/index.js';

export class Bot {
  public readonly telegraf: Telegraf<Context<Update>>;

  constructor(token: string) {
    this.telegraf = new Telegraf(token);
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.telegraf.use((ctx, next) => {
      logger.debug({ update: ctx.update }, 'Received an update');
      return next();
    });
  }

  public registerCommandHandler(handler: CommandHandler): void {
    this.telegraf.start(handler.onStart.bind(handler));
    this.telegraf.command(
      'play',
      handler.onPlay.bind(handler, config.GAME_SHORT_NAME),
    );
    this.telegraf.command('snake', handler.onSnake.bind(handler));
  }

  public registerGameHandler(handler: GameHandler): void {
    this.telegraf.on('callback_query', handler.onCallbackQuery.bind(handler));
    this.telegraf.on('inline_query', handler.onInlineQuery.bind(handler));
  }

  public async launch(): Promise<void> {
    await this.telegraf.launch();
  }

  public stop(signal: string): void {
    this.telegraf.stop(signal);
  }
}

