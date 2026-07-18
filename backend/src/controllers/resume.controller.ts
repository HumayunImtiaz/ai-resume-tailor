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
  }) as RequestHandler
};
