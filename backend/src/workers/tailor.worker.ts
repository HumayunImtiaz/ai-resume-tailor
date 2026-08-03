import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import prisma from '../config/database';
import { TailorJobPayload } from '../queues/tailor.queue';
import { analyzeMatch } from '../services/ai.service';
import logger from '../config/logger';

// Initialize the worker setup function
export const initializeTailorWorker = () => {
  const worker = new Worker<TailorJobPayload>(
    'tailor-resume',
    async (job: Job<TailorJobPayload>) => {
      logger.info(`Worker started processing tailor job: ${job.id}`);

      const { resumeId, jobDescriptionId } = job.data;

      // Fetch the actual Resume and JobDescription records to get their rawText
      const [resume, jobDescription] = await Promise.all([
        prisma.resume.findUnique({
          where: { id: resumeId },
          include: {
            user: {
              include: {
                coverLetters: {
                  orderBy: { uploadedAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }),
        prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } }),
      ]);

      if (!resume || !jobDescription) {
        throw new Error(
          `[Worker] Job ${job.id}: Could not find resume (${resumeId}) or job description (${jobDescriptionId}) in database.`
        );
      }

      const coverLetterText = resume.user.coverLetters[0]?.rawText || '';

      // Run real AI analysis
      const aiResult = await analyzeMatch(resume.rawText, jobDescription.rawText, (resume.links as any) || [], coverLetterText);

      let matchScore: number;
      let matchedSkills: any;
      let missingSkills: any;
      let atsAnalysis: any;
      let tailoredText: string;

      if (!aiResult.success || !aiResult.data) {
        // Graceful fallback — log clearly and continue with neutral values
        logger.error(`Worker job ${job.id}: AI analysis failed — falling back to placeholder values`);
        matchScore = 0;
        matchedSkills = [];
        missingSkills = [];
        atsAnalysis = {};
        tailoredText = JSON.stringify({});
      } else {
        const tr = aiResult.data.tailoredResume as any;
        logger.info(`Worker job ${job.id}: AI analysis succeeded`, {
          matchScore: aiResult.data.matchScore,
          missingSkills: aiResult.data.missingSkills?.length || 0,
        });
        matchScore = aiResult.data.matchScore;
        matchedSkills = aiResult.data.matchedSkills;
        missingSkills = aiResult.data.missingSkills;
        atsAnalysis = aiResult.data.atsAnalysis;
        tailoredText = JSON.stringify(tr);
      }

      // Persist the TailoredVersion with real (or fallback) AI values
      await prisma.tailoredVersion.create({
        data: {
          resumeId,
          jobDescriptionId,
          matchScore,
          matchedSkills,
          missingSkills,
          atsAnalysis,
          tailoredText,
        },
      });

      logger.info(`Worker successfully completed tailor job: ${job.id}`);
    },
    {
      connection: redisConnection,
    }
  );

  // Handle errors
  worker.on('failed', (job: Job<TailorJobPayload> | undefined, err: Error) => {
    if (job) {
      logger.error(`Worker job ${job.id} failed`, { error: err.message });
    } else {
      logger.error('Worker job failed (unknown job)', { error: err.message });
    }
  });

  worker.on('error', (err: Error) => {
    logger.error('Worker error', { error: err.message });
  });

  logger.info('Tailor worker listening for jobs');
  return worker;
};
