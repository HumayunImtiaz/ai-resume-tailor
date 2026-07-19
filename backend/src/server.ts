import app from './app';
import env from './config/env';
import { initializeTailorWorker } from './workers/tailor.worker';

// Start the Express server
app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

// Start the background workers
initializeTailorWorker();
