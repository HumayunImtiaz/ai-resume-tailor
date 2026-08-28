import { Request, Response, RequestHandler } from 'express';
import { coverLetterService } from '../services/coverLetter.service';
import { sendResponse } from '../utils/apiResponse';

export const coverLetterController = {
  uploadCoverLetter: (async (req: Request, res: Response) => {
    if (!req.file) {
      sendResponse(res, 400, 'error', null, 'No file uploaded');
      return;
    }

    const userId = req.userId as string;

    const result = await coverLetterService.uploadCoverLetter(userId, req.file);

    if (!result.success) {
      if (result.error === 'Something went wrong, please try again') {
        sendResponse(res, 500, 'error', null, result.error);
      } else {
        sendResponse(res, 422, 'error', null, result.error);
      }
      return;
    }

    sendResponse(res, 201, 'success', result.data, 'Cover letter uploaded successfully');
  }) as RequestHandler,

  listCoverLetters: (async (req: Request, res: Response) => {
    const userId = req.userId as string;

    const result = await coverLetterService.listCoverLetters(userId);

    if (!result.success) {
      sendResponse(res, 500, 'error', null, result.error);
      return;
    }

    sendResponse(res, 200, 'success', result.data, 'Your Cover letters retrieved successfully');
  }) as RequestHandler,

  deleteCoverLetter: (async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const coverLetterId = req.params.id as string;

    const result = await coverLetterService.deleteCoverLetter(userId, coverLetterId);

    if (!result.success) {
      if (result.error === 'Cover letter not found') {
        sendResponse(res, 404, 'error', null, result.error as string);
      } else {
        sendResponse(res, 500, 'error', null, result.error as string);
      }
      return;
    }

    sendResponse(res, 200, 'success', null, 'Cover letter deleted successfully');
  }) as RequestHandler,
};
