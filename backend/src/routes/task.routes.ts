import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createTaskController, getTasksController, getTaskByIdController, updateTaskController, deleteTaskController } from '../controllers/task.controller';

const router = express.Router({ mergeParams: true });

// POST /api/v1/projects/:projectId/tasks — Create a new task (Project Member only)
router.post('/',requireAuth,validateBody(['title']),createTaskController);

// GET /api/v1/projects/:projectId/tasks — Get all tasks for a project
router.get('/', requireAuth, getTasksController);

// GET /api/v1/projects/:projectId/tasks/:taskId — Get a single task
router.get('/:taskId', requireAuth, getTaskByIdController);

// PATCH /api/v1/projects/:projectId/tasks/:taskId — Update task fields
router.patch('/:taskId', requireAuth, updateTaskController);

// DELETE /api/v1/projects/:projectId/tasks/:taskId - delete single task
router.delete('/:taskId', requireAuth, deleteTaskController);


export default router;
