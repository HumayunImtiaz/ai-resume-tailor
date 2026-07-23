import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import prisma from '../config/database';
import { TailorJobPayload } from '../queues/tailor.queue';
import { analyzeMatch } from '../services/ai.service';

// Initialize the worker setup function
export const initializeTailorWorker = () => {
  const worker = new Worker<TailorJobPayload>(
    'tailor-resume',
    async (job: Job<TailorJobPayload>) => {
      console.log(`[Worker] Started processing tailor job: ${job.id}`);

      const { resumeId, jobDescriptionId } = job.data;

      // Fetch the actual Resume and JobDescription records to get their rawText
      const [resume, jobDescription] = await Promise.all([
        prisma.resume.findUnique({ where: { id: resumeId } }),
        prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } }),
      ]);

      if (!resume || !jobDescription) {
        throw new Error(
          `[Worker] Job ${job.id}: Could not find resume (${resumeId}) or job description (${jobDescriptionId}) in database.`
        );
      }

      // Run real AI analysis
      const aiResult = await analyzeMatch(resume.rawText, jobDescription.rawText);

      let matchScore: number;
      let missingKeywords: string[];
      let tailoredText: string;

      if (!aiResult.success) {
        // Graceful fallback — log clearly and continue with neutral values
        console.error(
          `[Worker] Job ${job.id}: AI analysis failed — falling back to placeholder values (matchScore: 0, missingKeywords: []).`
        );
        matchScore = 0;
        missingKeywords = [];
        tailoredText = '';
      } else {
        console.log(
          `[Worker] Job ${job.id}: AI analysis succeeded — matchScore: ${aiResult.data!.matchScore}, missingKeywords: [${aiResult.data!.missingKeywords.join(', ')}], tailoredText: ${aiResult.data!.tailoredText?.length || 0} characters.`
        );
        matchScore = aiResult.data!.matchScore;
        missingKeywords = aiResult.data!.missingKeywords;
        tailoredText = aiResult.data!.tailoredText || '';
      }

      // Persist the TailoredVersion with real (or fallback) AI values
      await prisma.tailoredVersion.create({
        data: {
          resumeId,
          jobDescriptionId,
          matchScore,
          missingKeywords,
          tailoredText,
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
