import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createTaskController, getTasksController, getTaskByIdController, updateTaskController, deleteTaskController } from '../controllers/task.controller';

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Setup database
 *               description:
 *                 type: string
 *                 example: Initialize PostgreSQL
 *               status:
 *                 type: string
 *                 enum: [Todo, In Progress, Review, Done]
 *                 example: Todo
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Urgent]
 *                 example: High
 *               assigneeId:
 *                 type: integer
 *                 example: 2
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created successfully
 *       403:
 *         description: Forbidden (Not a project member)
 */
// POST /api/v1/projects/:projectId/tasks — Create a new task (Project Member only)
router.post('/',requireAuth,validateBody(['title']),createTaskController);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: Get all tasks for a project (Kanban Board View)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of tasks per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search tasks by title or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter tasks by status (e.g. 'Todo')
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter tasks by priority (e.g. 'High')
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: integer
 *         description: Filter tasks by assignee ID
 *     responses:
 *       200:
 *         description: Paginated list of tasks matching filters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Forbidden (Not a project member)
 */
// GET /api/v1/projects/:projectId/tasks — Get all tasks for a project
router.get('/', requireAuth, getTasksController);

/**
 * @swagger
 * /projects/{projectId}/tasks/{taskId}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       403:
 *         description: Forbidden (Not a project member)
 *       404:
 *         description: Task not found
 */
// GET /api/v1/projects/:projectId/tasks/:taskId — Get a single task
router.get('/:taskId', requireAuth, getTaskByIdController);

/**
 * @swagger
 * /projects/{projectId}/tasks/{taskId}:
 *   patch:
 *     summary: Update task fields (status, priority, assignment)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Todo, In Progress, Review, Done]
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Urgent]
 *               assigneeId:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       403:
 *         description: Forbidden (Not a project member)
 */
// PATCH /api/v1/projects/:projectId/tasks/:taskId — Update task fields
router.patch('/:taskId', requireAuth, updateTaskController);

/**
 * @swagger
 * /projects/{projectId}/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Forbidden (Requires Project Admin/Workspace Owner)
 *       404:
 *         description: Task not found
 */
// DELETE /api/v1/projects/:projectId/tasks/:taskId - delete single task
router.delete('/:taskId', requireAuth, deleteTaskController);

export default router;
