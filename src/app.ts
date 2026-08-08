import express, { Application } from 'express';
import { configureSecurity } from './middleware/security.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app: Application = express();

// Request body parser
app.use(express.json());

// Security configuration
configureSecurity(app);

// API Router namespace
const apiRouter = express.Router();

// Register v1 router
app.use('/api/v1', apiRouter);

// Fallback for unhandled routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
