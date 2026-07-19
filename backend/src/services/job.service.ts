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
