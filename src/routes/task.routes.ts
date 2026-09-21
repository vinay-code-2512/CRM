import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createTaskController, getTasksController, getTaskByIdController } from '../controllers/task.controller';

const router = express.Router({ mergeParams: true });

// POST /api/v1/projects/:projectId/tasks — Create a new task (Project Member only)
router.post('/',requireAuth,validateBody(['title']),createTaskController);

// GET /api/v1/projects/:projectId/tasks — Get all tasks for a project
router.get('/', requireAuth, getTasksController);

// GET /api/v1/projects/:projectId/tasks/:taskId — Get a single task
router.get('/:taskId', requireAuth, getTaskByIdController);


export default router;
