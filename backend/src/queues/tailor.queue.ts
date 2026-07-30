import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

// Define the payload interface for the tailor job
export interface TailorJobPayload {
  userId: string;
  resumeId: string;
  jobDescriptionId: string;
}

// Initialize the queue
export const tailorQueue = new Queue('tailor-resume', {
  connection: redisConnection,
});

/**
 * Adds a new job to the tailor queue.
 * @param payload The job payload containing userId, resumeId, and jobDescriptionId
 * @returns The job ID or undefined if adding fails in unexpected ways (BullMQ throws on errors generally)
 */
export async function addTailorJob(payload: TailorJobPayload) {
  const job = await tailorQueue.add('tailor', payload);
  return job.id;
}
