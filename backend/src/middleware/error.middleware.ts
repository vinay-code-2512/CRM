import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  
  // SECURITY: Do not expose raw error messages to the client for 500 Internal Server Errors
  // We still log the real err.message to the console on line 4, but the client only sees a safe generic message.
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;
  
  // Map specific error types if needed later
  let errorType = 'ServerError';
  if (statusCode === 400) errorType = 'BadRequest';
  if (statusCode === 401) errorType = 'Unauthorized';
  if (statusCode === 403) errorType = 'Forbidden';
  if (statusCode === 404) errorType = 'NotFound';
  
  res.status(statusCode).json({
    error: err.name || errorType, 
    message: message
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested resource was not found'
  });
};
