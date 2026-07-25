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
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="tailored-resume.docx"');
      res.send(result.data);
    }
  }) as RequestHandler,
};
