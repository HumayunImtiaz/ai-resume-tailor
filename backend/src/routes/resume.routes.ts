import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.middleware';
import { resumeController } from '../controllers/resume.controller';

const router = Router();

// Configure multer with memory storage and 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * @swagger
 * tags:
 *   name: Resumes
 *   description: Resume management endpoints
 */

/**
 * @swagger
 * /api/resumes/upload:
 *   post:
 *     summary: Upload and parse a resume
 *     tags: [Resumes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Resume uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: File parsing failed
 *       500:
 *         description: Server error
 */
router.post(
  '/upload',
  requireAuth,
  upload.single('resume'),
  resumeController.uploadResume
);

export default router;
