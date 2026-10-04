import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';
import { Application } from 'express';

// Global API rate limiter (generous limit for normal usage)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 500, // 500 requests per IP
  skip: () => process.env.NODE_ENV === 'test', // Bypass in test environment
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

// Strict limiter for authentication endpoints (prevents brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Only 10 requests per IP
  skip: () => process.env.NODE_ENV === 'test', // Bypass in test environment
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  }
});

export const configureSecurity = (app: Application) => {
  // Helmet for secure HTTP headers
  app.use(helmet());

  // CORS configuration based on environment variable
  app.use(cors({
    origin: ENV.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Apply the global rate limiting middleware to all API calls
  app.use('/api', globalLimiter);
};
