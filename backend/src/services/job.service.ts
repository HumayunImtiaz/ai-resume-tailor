import prisma from '../config/database';
import { addTailorJob } from '../queues/tailor.queue';
import { tailorQueue } from '../queues/tailor.queue';
import { generateResumeDocx } from './docx.service';
import { generateResumePdf } from './pdf.service';
import { analyzeBaseMatch } from './ai.service';
import logger from '../config/logger';

interface CreateJobInput {
  resumeId: string;
  title: string;
  company?: string;
  rawText: string;
}

export const jobService = {
  analyzeJobMatch: async (userId: string, data: CreateJobInput) => {
    try {
      // Find the resume
      const resume = await prisma.resume.findFirst({
        where: { id: data.resumeId, userId },
      });
      let coverLetterText = undefined;
      const cl = await prisma.coverLetter.findFirst({ where: { userId } });
      if (cl) {
        coverLetterText = cl.rawText;
      }

      if (!resume) {
        return { success: false as const, error: 'Resume not found' };
      }

      const result = await analyzeBaseMatch(resume.rawText, data.rawText, coverLetterText);
      if (!result.success) {
        return { success: false as const, error: 'Failed to analyze job match' };
      }

      return {
        success: true as const,
        data: result.data,
      };
    } catch (error) {
      logger.error('Analyze job match error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

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
      logger.error('Create job description error', { error });
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
          select: { matchScore: true, matchedSkills: true, missingSkills: true, atsAnalysis: true, tailoredText: true },
        });

        if (tailoredVersion) {
          let tailoredResume = undefined;
          try {
            tailoredResume = JSON.parse(tailoredVersion.tailoredText);
          } catch (_e) {
            // Ignored, fallback to undefined
          }

          return {
            success: true as const,
            data: {
              state,
              matchScore: tailoredVersion.matchScore,
              matchedSkills: tailoredVersion.matchedSkills,
              missingSkills: tailoredVersion.missingSkills,
              atsAnalysis: tailoredVersion.atsAnalysis,
              tailoredResume,
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
      logger.error('Get job status error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  getTailoredDocx: async (userId: string, jobDescriptionId: string) => {
    try {
      const jobDescription = await prisma.jobDescription.findFirst({
        where: { id: jobDescriptionId, userId },
      });

      if (!jobDescription) {
        return { success: false as const, error: 'Job not found' };
      }

      const tailoredVersion = await prisma.tailoredVersion.findFirst({
        where: { jobDescriptionId },
        orderBy: { createdAt: 'desc' },
      });

      if (!tailoredVersion || !tailoredVersion.tailoredText) {
        return { success: false as const, error: 'Tailored resume not ready yet' };
      }

      let parsedResume;
      try {
        parsedResume = JSON.parse(tailoredVersion.tailoredText);
        if (!parsedResume || !parsedResume.fullName) {
          return { success: false as const, error: 'Tailored resume not ready yet' };
        }
      } catch (_e) {
        return { success: false as const, error: 'Tailored resume format is invalid' };
      }

      const result = await generateResumeDocx(parsedResume);
      if (!result.success || !result.data) {
        return { success: false as const, error: 'Could not generate document' };
      }

      return { success: true as const, data: result.data };
    } catch (error) {
      logger.error('Get tailored docx error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  getTailoredPdf: async (userId: string, jobDescriptionId: string) => {
    try {
      const jobDescription = await prisma.jobDescription.findFirst({
        where: { id: jobDescriptionId, userId },
      });

      if (!jobDescription) {
        return { success: false as const, error: 'Job not found' };
      }

      const tailoredVersion = await prisma.tailoredVersion.findFirst({
        where: { jobDescriptionId },
        orderBy: { createdAt: 'desc' },
      });

      if (!tailoredVersion || !tailoredVersion.tailoredText) {
        return { success: false as const, error: 'Tailored resume not ready yet' };
      }

      let parsedResume;
      try {
        parsedResume = JSON.parse(tailoredVersion.tailoredText);
        if (!parsedResume || !parsedResume.fullName) {
          return { success: false as const, error: 'Tailored resume not ready yet' };
        }
      } catch (_e) {
        return { success: false as const, error: 'Tailored resume format is invalid' };
      }

      const result = await generateResumePdf(parsedResume);
      if (!result.success) {
        // Propagate the specific error from PDF generation for better debugging
        return { success: false as const, error: result.error ?? 'Could not generate document' };
      }
      if (!result.data) {
        return { success: false as const, error: 'PDF generation succeeded but no data returned' };
      }

      return { success: true as const, data: result.data };
    } catch (error) {
      logger.error('Get tailored pdf error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  getTailoredVersionDetail: async (userId: string, tailoredVersionId: string) => {
    try {
      const tailoredVersion = await prisma.tailoredVersion.findUnique({
        where: { id: tailoredVersionId },
        include: {
          resume: true,
          jobDescription: {
            select: {
              id: true,
              title: true,
              company: true,
            },
          },
        },
      });

      if (!tailoredVersion || tailoredVersion.resume.userId !== userId) {
        return { success: false as const, error: 'Tailored version not found' };
      }

      let tailoredResume;
      try {
        tailoredResume = JSON.parse(tailoredVersion.tailoredText);
      } catch (_e) {
        // Ignored, fallback to undefined
      }

      return {
        success: true as const,
        data: {
          id: tailoredVersion.id,
          matchScore: tailoredVersion.matchScore,
          matchedSkills: tailoredVersion.matchedSkills,
          missingSkills: tailoredVersion.missingSkills,
          atsAnalysis: tailoredVersion.atsAnalysis,
          tailoredResume,
          jobDescription: tailoredVersion.jobDescription,
          createdAt: tailoredVersion.createdAt,
        },
      };
    } catch (error) {
      logger.error('Get tailored version detail error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  deleteTailoredVersion: async (userId: string, tailoredVersionId: string) => {
    try {
      const tailoredVersion = await prisma.tailoredVersion.findUnique({
        where: { id: tailoredVersionId },
        include: { resume: true },
      });

      if (!tailoredVersion || tailoredVersion.resume.userId !== userId) {
        return { success: false as const, error: 'Tailored version not found' };
      }

      await prisma.tailoredVersion.delete({
        where: { id: tailoredVersionId },
      });

      return { success: true as const };
    } catch (error) {
      logger.error('Delete tailored version error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },

  deleteAllTailoredVersions: async (userId: string) => {
    try {
      // Find all resumes belonging to user
      const userResumes = await prisma.resume.findMany({
        where: { userId },
        select: { id: true },
      });

      const resumeIds = userResumes.map((r) => r.id);

      await prisma.tailoredVersion.deleteMany({
        where: {
          resumeId: { in: resumeIds },
        },
      });

      return { success: true as const };
    } catch (error) {
      logger.error('Delete all tailored versions error', { error });
      return { success: false as const, error: 'Something went wrong, please try again' };
    }
  },
};
