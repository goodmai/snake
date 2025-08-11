import { Context } from 'telegraf';
import { config } from '../config/index.js';

export class CommandHandler {
  public onStart(ctx: Context): void {
    ctx.replyWithGame(config.GAME_SHORT_NAME);
  }

  public onPlay(_gameShortName: string, ctx: Context): void {
    ctx.replyWithGame(config.GAME_SHORT_NAME);
  }

  public onSnake(ctx: Context): void {
    ctx.replyWithGame(config.GAME_SHORT_NAME);
  }
}

