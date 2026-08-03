import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { jobController } from '../controllers/job.controller';
import { aiLimiter } from '../middlewares/rateLimiter.middleware';

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
 *     description: "Rate limited: max 20 requests per hour"
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
router.post('/', requireAuth, aiLimiter, jobController.createJob);

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
 *                     matchedSkills:
 *                       type: array
 *                       description: Skills from the JD found in the resume. Present only when state is "completed".
 *                       items:
 *                         type: string
 *                       example: ["React", "Node.js"]
 *                     missingSkills:
 *                       type: array
 *                       description: Skills from the JD missing from the resume with reasons. Present only when state is "completed".
 *                       items:
 *                         type: object
 *                         properties:
 *                           skill:
 *                             type: string
 *                           reason:
 *                             type: string
 *                     atsAnalysis:
 *                       type: object
 *                       description: ATS analysis with strengths, gaps, and recommendations. Present only when state is "completed".
 *                       properties:
 *                         strengths:
 *                           type: array
 *                           items:
 *                             type: string
 *                         gaps:
 *                           type: array
 *                           items:
 *                             type: string
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: string
 *                     tailoredResume:
 *                       type: object
 *                       description: The structured AI-rewritten resume. Present only when state is "completed".
 *                       properties:
 *                         fullName:
 *                           type: string
 *                         title:
 *                           type: string
 *                         summary:
 *                           type: string
 *                         skills:
 *                           type: array
 *                           items:
 *                             type: string
 *                         experience:
 *                           type: array
 *                           items:
 *                             type: object
 *                         education:
 *                           type: array
 *                           items:
 *                             type: object
 *                         projects:
 *                           type: array
 *                           items:
 *                             type: object
 *                         certifications:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.get('/status/:jobId', requireAuth, jobController.getJobStatus);

/**
 * @swagger
 * /api/jobs/{jobDescriptionId}/download:
 *   get:
 *     summary: Download the tailored resume as a DOCX file
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobDescriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job description
 *     responses:
 *       200:
 *         description: The tailored resume DOCX file
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Job not found or tailored resume not ready yet
 *       500:
 *         description: Server error or document generation failed
 */
router.get('/:jobDescriptionId/download', requireAuth, jobController.downloadTailoredDocx);

/**
 * @swagger
 * /api/jobs/{jobDescriptionId}/download-pdf:
 *   get:
 *     summary: Download the tailored resume as a PDF file
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobDescriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the job description
 *     responses:
 *       200:
 *         description: The tailored resume PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Job not found or tailored resume not ready yet
 *       500:
 *         description: Server error or document generation failed
 */
router.get('/:jobDescriptionId/download-pdf', requireAuth, jobController.downloadTailoredPdf);

/**
 * @swagger
 * /api/jobs/versions/{id}:
 *   get:
 *     summary: Get full details of a specific tailored version
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tailored version
 *     responses:
 *       200:
 *         description: Tailored version details retrieved successfully
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
 *                     id:
 *                       type: string
 *                     matchScore:
 *                       type: integer
 *                     matchedSkills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     missingSkills:
 *                       type: array
 *                       items:
 *                         type: object
 *                     atsAnalysis:
 *                       type: object
 *                     tailoredResume:
 *                       type: object
 *                     jobDescription:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         company:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tailored version not found
 *       500:
 *         description: Server error
 */
router.get('/versions/:id', requireAuth, jobController.getTailoredVersionDetail);

export default router;
