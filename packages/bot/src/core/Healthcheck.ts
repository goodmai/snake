import express from 'express';
import { logger } from './Logger.js';

export function createHealthcheckServer() {
  const app = express();
  // Middleware to parse JSON bodies
  app.use(express.json());
  
  const port = 3001;

  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  const server = app.listen(port, () => {
    logger.info(`Healthcheck and API server running on http://localhost:${port}`);
  });

  return { app, server };
}

