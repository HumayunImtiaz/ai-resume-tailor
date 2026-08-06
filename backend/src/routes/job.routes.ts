import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { jobController } from '../controllers/job.controller';
import { aiLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// POST /api/jobs - Create job description & enqueue AI tailoring job (Rate limited)
router.post('/', requireAuth, aiLimiter, jobController.createJob);

// GET /api/jobs/status/:jobId - Poll status & results of a queued tailoring job
router.get('/status/:jobId', requireAuth, jobController.getJobStatus);

// POST /api/jobs/:jobDescriptionId/download - Download tailored resume as DOCX
router.post('/:jobDescriptionId/download', requireAuth, jobController.downloadTailoredDocx);

// POST /api/jobs/:jobDescriptionId/download-pdf - Download tailored resume as PDF
router.post('/:jobDescriptionId/download-pdf', requireAuth, jobController.downloadTailoredPdf);

// GET /api/jobs/versions/:id - Get full details of a specific saved tailored version
router.get('/versions/:id', requireAuth, jobController.getTailoredVersionDetail);

export default router;
