import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createTaskController } from '../controllers/task.controller';

const router = express.Router({ mergeParams: true });

// POST /api/v1/projects/:projectId/tasks — Create a new task (Project Member only)
router.post('/',requireAuth,validateBody(['title']),createTaskController);

export default router;
