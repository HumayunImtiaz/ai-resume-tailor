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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.get('/status/:jobId', requireAuth, jobController.getJobStatus);

export default router;
