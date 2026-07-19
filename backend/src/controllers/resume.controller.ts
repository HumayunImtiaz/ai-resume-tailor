import { Request, Response, RequestHandler } from 'express';
import { resumeService } from '../services/resume.service';
import { sendResponse } from '../utils/apiResponse';

export const resumeController = {
  uploadResume: (async (req: Request, res: Response) => {
    if (!req.file) {
      sendResponse(res, 400, 'error', null, 'No file uploaded');
      return;
    }

    const userId = req.userId as string;

    const result = await resumeService.uploadResume(userId, req.file);

    if (!result.success) {
      // 500 for unexpected failures — we mapped unexpected to 'Something went wrong, please try again' in the service
      if (result.error === 'Something went wrong, please try again') {
        sendResponse(res, 500, 'error', null, result.error);
      } else {
        // 422 if parsing failed
        sendResponse(res, 422, 'error', null, result.error);
      }
      return;
    }

    sendResponse(res, 201, 'success', result.data, 'Resume uploaded successfully');
  }) as RequestHandler,

  listResumes: (async (req: Request, res: Response) => {
    const userId = req.userId as string;

    const result = await resumeService.listResumes(userId);

    if (!result.success) {
      sendResponse(res, 500, 'error', null, result.error);
      return;
    }

    sendResponse(res, 200, 'success', result.data, 'Resumes retrieved successfully');
  }) as RequestHandler,

  deleteResume: (async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const resumeId = req.params.id as string;

    const result = await resumeService.deleteResume(userId, resumeId);

    if (!result.success) {
      if (result.error === 'Resume not found') {
        sendResponse(res, 404, 'error', null, result.error as string);
      } else {
        sendResponse(res, 500, 'error', null, result.error as string);
      }
      return;
    }

    sendResponse(res, 200, 'success', null, 'Resume deleted successfully');
  }) as RequestHandler
};
