import { Bot } from './core/Bot.js';
import { config } from './config/index.js';
import { logger } from './core/Logger.js';
import { CommandHandler } from './handlers/command.handler.js';
import { GameHandler } from './handlers/game.handler.js';
import { createHealthcheckServer } from './core/Healthcheck.js';
import { setupScoreHandling } from './core/ScoreHandler.js';

async function bootstrap() {
  const { app, server: healthcheckServer } = createHealthcheckServer();
  const bot = new Bot(config.BOT_TOKEN);

  const commandHandler = new CommandHandler();
  const gameHandler = new GameHandler(config.GAME_SHORT_NAME, config.GAME_URL);

  bot.registerCommandHandler(commandHandler);
  bot.registerGameHandler(gameHandler);

  setupScoreHandling(app, bot.telegraf);

  await bot.launch();
  logger.info('🚀 Bot has been successfully launched!');

  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    bot.stop(signal);
    healthcheckServer.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  logger.fatal(error, '💀 Bot launch failed');
  process.exit(1);
});

