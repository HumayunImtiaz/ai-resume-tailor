import { z } from 'zod';

export const createJobSchema = z.object({
  resumeId: z.string().uuid("resumeId must be a valid UUID"),
  title: z.string().min(1, "Title is required"),
  company: z.string().optional(),
  rawText: z.string().min(20, "Job description must be at least 20 characters"),
});
