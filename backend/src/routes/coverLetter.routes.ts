import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.middleware';
import { coverLetterController } from '../controllers/coverLetter.controller';

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
 *   name: CoverLetters
 *   description: Cover Letter management endpoints
 */

/**
 * @swagger
 * /api/cover-letters/upload:
 *   post:
 *     summary: Upload and parse a cover letter
 *     tags: [CoverLetters]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Cover letter uploaded successfully
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
  upload.single('coverLetter'), // Note: the field name in FormData must be 'coverLetter'
  coverLetterController.uploadCoverLetter
);

/**
 * @swagger
 * /api/cover-letters:
 *   get:
 *     summary: List all cover letters for the authenticated user
 *     tags: [CoverLetters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cover letters retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, coverLetterController.listCoverLetters);

router.get('/:id/preview', requireAuth, coverLetterController.getCoverLetterPreview);

/**
 * @swagger
 * /api/cover-letters/{id}:
 *   delete:
 *     summary: Delete a cover letter by ID
 *     tags: [CoverLetters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cover Letter ID
 *     responses:
 *       200:
 *         description: Cover letter deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cover letter not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requireAuth, coverLetterController.deleteCoverLetter);

export default router;
