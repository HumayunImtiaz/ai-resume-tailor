import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { jobController } from '../controllers/job.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job description and tailoring queue endpoints
 */

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a job description and enqueue a tailoring job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resumeId
 *               - title
 *               - rawText
 *             properties:
 *               resumeId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               rawText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job created and queued successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Resume not found
 *       500:
 *         description: Server error
 */
router.post('/', requireAuth, jobController.createJob);

/**
 * @swagger
 * /api/jobs/status/{jobId}:
 *   get:
 *     summary: Get the status of a queued tailoring job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The BullMQ job ID returned from the create endpoint
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     state:
 *                       type: string
 *                       enum: [waiting, active, completed, failed, delayed, unknown]
 *                       example: completed
 *                     matchScore:
 *                       type: integer
 *                       description: AI-computed match percentage (0–100). Present only when state is "completed".
 *                       example: 78
 *                     missingKeywords:
 *                       type: array
 *                       description: Keywords from the job description missing in the resume. Present only when state is "completed".
 *                       items:
 *                         type: string
 *                       example: ["Kubernetes", "GraphQL"]
 *                     tailoredText:
 *                       type: string
 *                       description: The AI-rewritten resume text. Present only when state is "completed".
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.get('/status/:jobId', requireAuth, jobController.getJobStatus);

export default router;
