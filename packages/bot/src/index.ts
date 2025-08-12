import { Bot } from './core/Bot.js';
import { config } from './config/index.js';
import { logger } from './core/Logger.js';
import { CommandHandler } from './handlers/command.handler.js';
import { GameHandler } from './handlers/game.handler.js';
import { createHealthcheckServer } from './core/Healthcheck.js';
import { setupScoreHandling } from './core/ScoreHandler.js';

// Sentry initialization (disabled in tests)
if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
  const Sentry = await import('@sentry/node');
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  process.on('unhandledRejection', (reason) => {
    try { (Sentry as any).captureException?.(reason); } catch {}
    logger.error({ reason }, 'UnhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    try { (Sentry as any).captureException?.(err); } catch {}
    logger.fatal(err, 'UncaughtException');
  });
}

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

