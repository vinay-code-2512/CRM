import { Request, Response, NextFunction } from 'express';

// Simple foundation validation middleware for request bodies
export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing: string[] = [];

    requiredFields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      res.status(400).json({
        error: 'ValidationError',
        message: `Missing required fields: ${missing.join(', ')}`
      });
      return; // Do not call next()
    }

    next();
  };
};
