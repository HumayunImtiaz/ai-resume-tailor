import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import prisma from '../config/database';
import { TailorJobPayload } from '../queues/tailor.queue';

// Initialize the worker setup function
export const initializeTailorWorker = () => {
  const worker = new Worker<TailorJobPayload>(
    'tailor-resume',
    async (job: Job<TailorJobPayload>) => {
      console.log(`[Worker] Started processing tailor job: ${job.id}`);
      
      const { userId, resumeId, jobDescriptionId } = job.data;

      // Simulate processing parsing/matching (2.5 seconds delay)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Create TailoredVersion skeleton/placeholder
      await prisma.tailoredVersion.create({
        data: {
          resumeId,
          jobDescriptionId,
          matchScore: 0,
          missingKeywords: [], // empty Json placeholder
          tailoredText: "",    // empty placeholder
        },
      });

      console.log(`[Worker] Successfully completed tailor job: ${job.id}`);
    },
    {
      connection: redisConnection,
    }
  );

  // Handle errors
  worker.on('failed', (job: Job<TailorJobPayload> | undefined, err: Error) => {
    if (job) {
      console.error(`[Worker] Job ${job.id} failed with error:`, err.message);
    } else {
      console.error(`[Worker] A job failed with error:`, err.message);
    }
  });

  worker.on('error', (err: Error) => {
    console.error(`[Worker] Worker error:`, err.message);
  });

  console.log('Tailor worker listening for jobs...');
  return worker;
};
