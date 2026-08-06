import { Request, Response, RequestHandler } from 'express';
import { createJobSchema } from '../validators/job.validator';
import { jobService } from '../services/job.service';
import { sendResponse } from '../utils/apiResponse';

export const jobController = {
  createJob: (async (req: Request, res: Response) => {
    const validationResult = createJobSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
      sendResponse(res, 400, 'error', null, errorMessage);
      return;
    }

    const userId = req.userId as string;

    const result = await jobService.createJobDescription(userId, validationResult.data);

    if (!result.success) {
      if (result.error === 'Resume not found') {
        sendResponse(res, 404, 'error', null, result.error);
      } else {
        sendResponse(res, 500, 'error', null, result.error);
      }
      return;
    }

    sendResponse(res, 201, 'success', result.data, 'Job created and queued successfully');
  }) as RequestHandler,

  getJobStatus: (async (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;

    const result = await jobService.getJobStatus(jobId);

    if (!result.success) {
      if (result.error === 'Job not found') {
        sendResponse(res, 404, 'error', null, result.error);
      } else {
        sendResponse(res, 500, 'error', null, result.error);
      }
      return;
    }

    sendResponse(res, 200, 'success', result.data, 'Job status retrieved successfully');
  }) as RequestHandler,

  downloadTailoredDocx: (async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const jobDescriptionId = req.params.jobDescriptionId as string;

    const result = await jobService.getTailoredDocx(userId, jobDescriptionId);

    if (!result.success) {
      const statusCode = result.error === 'Could not generate document' || result.error === 'Something went wrong, please try again' ? 500 : 404;
      sendResponse(res, statusCode, 'error', null, result.error);
      return;
    }

    if (result.data) {
      const base64 = Buffer.from(result.data).toString('base64');
      res.json({
        success: true,
        data: base64,
        filename: 'tailored-resume.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    }
  }) as RequestHandler,

  downloadTailoredPdf: (async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const jobDescriptionId = req.params.jobDescriptionId as string;

    const result = await jobService.getTailoredPdf(userId, jobDescriptionId);

    if (!result.success) {
      const statusCode = result.error === 'Could not generate document' || result.error === 'Something went wrong, please try again' ? 500 : 404;
      sendResponse(res, statusCode, 'error', null, result.error);
      return;
    }

    if (result.data) {
      const base64 = Buffer.from(result.data).toString('base64');
      res.json({
        success: true,
        data: base64,
        filename: 'tailored-resume.pdf',
        mimeType: 'application/pdf',
      });
    }
  }) as RequestHandler,

  getTailoredVersionDetail: (async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const tailoredVersionId = req.params.id as string;

    const result = await jobService.getTailoredVersionDetail(userId, tailoredVersionId);

    if (!result.success) {
      if (result.error === 'Tailored version not found') {
        sendResponse(res, 404, 'error', null, result.error);
      } else {
        sendResponse(res, 500, 'error', null, result.error);
      }
      return;
    }

    sendResponse(res, 200, 'success', result.data, 'Tailored version detail retrieved successfully');
  }) as RequestHandler,
};
