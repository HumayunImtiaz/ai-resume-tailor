import { Response } from 'express';

export function sendResponse(
  res: Response,
  statusCode: number,
  status: 'success' | 'error',
  data: any | null,
  message: string
) {
  return res.status(statusCode).json({
    statusCode,
    status,
    data,
    message,
  });
}
