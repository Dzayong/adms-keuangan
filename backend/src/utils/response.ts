import { Response } from 'express';

export function sendSuccess(res: Response, data: any = {}, message: string = 'Success', statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res: Response, message: string = 'Error occurred', statusCode: number = 400, errors: any[] = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
