import app from './app';
import env from './config/env';
import logger from './config/logger';
import { initializeTailorWorker } from './workers/tailor.worker';

// Start the Express server
app.listen(env.port, () => {
  logger.info(`Server running on port ${env.port}`);
});

// Start the background workers
initializeTailorWorker();
