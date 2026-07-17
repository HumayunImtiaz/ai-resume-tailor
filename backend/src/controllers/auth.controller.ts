import { Request, Response, RequestHandler } from 'express';
import { signupSchema } from '../validators/auth.validator';
import { authService } from '../services/auth.service';
import { sendResponse } from '../utils/apiResponse';

export const authController = {
  signup: (async (req: Request, res: Response) => {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || 'Validation failed';
      sendResponse(res, 400, 'error', null, errorMessage);
      return;
    }

    const result = await authService.signup(validationResult.data);

    if (!result.success) {
      if (result.error === 'Email already registered') {
        sendResponse(res, 409, 'error', null, 'Email already registered');
      } else {
        sendResponse(res, 500, 'error', null, 'Something went wrong, please try again');
      }
      return;
    }

    sendResponse(res, 201, 'success', result.data, 'Account created successfully');
  }) as RequestHandler
};
