import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';
import { Application } from 'express';

export const configureSecurity = (app: Application) => {
  // Helmet for secure HTTP headers
  app.use(helmet());

  // CORS configuration based on environment variable
  app.use(cors({
    origin: ENV.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Basic API rate limiting and abuse protection
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      error: 'TooManyRequests',
      message: 'Too many requests from this IP, please try again after 15 minutes'
    }
  });

  // Apply the rate limiting middleware to API calls
  app.use('/api', apiLimiter);
};
