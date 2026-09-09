import express, { Application } from 'express';
import { configureSecurity } from './middleware/security.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';


const app: Application = express();

// Request body parser
app.use(express.json());

// Security configuration
configureSecurity(app);

// API Router namespace
const apiRouter = express.Router();

// Attach Workspace routes to the master router under the '/workspaces' path
apiRouter.use('/workspaces', workspaceRoutes);


// Attach Auth routes to the master router under the '/auth' path
apiRouter.use('/auth', authRoutes);

// Register v1 router
app.use('/api/v1', apiRouter);

// Fallback for unhandled routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
