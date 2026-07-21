import prisma from '../config/database';
import { addTailorJob } from '../queues/tailor.queue';
import { tailorQueue } from '../queues/tailor.queue';

interface CreateJobInput {
  resumeId: string;
  title: string;
  company?: string;
  rawText: string;
}

export const jobService = {
  createJobDescription: async (userId: string, data: CreateJobInput) => {
    try {
      // Verify the resume belongs to this user
      const resume = await prisma.resume.findFirst({
        where: { id: data.resumeId, userId },
      });

      if (!resume) {
        return { success: false as const, error: 'Resume not found' };
      }

      // Create the JobDescription record
      const jobDescription = await prisma.jobDescription.create({
        data: {
          userId,
          title: data.title,
          company: data.company || null,
          rawText: data.rawText,
        },
        select: {
          id: true,
          title: true,
          company: true,
          createdAt: true,
        },
      });

      // Enqueue the tailor job
      const queueJobId = await addTailorJob({
        userId,
        resumeId: data.resumeId,
        jobDescriptionId: jobDescription.id,
      });

      return {
        success: true as const,
        data: {
          jobDescription,
          queueJobId,
        },
      };
    } catch (error) {
      console.error('Create job description error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  getJobStatus: async (jobId: string) => {
    try {
      const job = await tailorQueue.getJob(jobId);

      if (!job) {
        return { success: false as const, error: 'Job not found' };
      }

      const state = await job.getState();

      if (state === 'completed') {
        const { resumeId, jobDescriptionId } = job.data;

        // Find the most recent TailoredVersion for this resume + job description pair
        const tailoredVersion = await prisma.tailoredVersion.findFirst({
          where: { resumeId, jobDescriptionId },
          orderBy: { createdAt: 'desc' },
          select: { matchScore: true, missingKeywords: true },
        });

        if (tailoredVersion) {
          return {
            success: true as const,
            data: {
              state,
              matchScore: tailoredVersion.matchScore,
              missingKeywords: tailoredVersion.missingKeywords,
            },
          };
        }

        // Edge case: worker completed but record not yet visible (race condition)
        return { success: true as const, data: { state } };
      }

      return {
        success: true as const,
        data: { state },
      };
    } catch (error) {
      console.error('Get job status error:', error);
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },
};
