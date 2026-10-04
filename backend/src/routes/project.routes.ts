import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createProjectController, getProjectsController, updateProjectController, addProjectMemberController, deleteProjectController } from '../controllers/project.controller';
import { getProjectActivityController } from '../controllers/activity.controller';

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /workspaces/{id}/projects:
 *   post:
 *     summary: Create a new project inside a workspace
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Website Redesign
 *               description:
 *                 type: string
 *                 example: Overhauling the frontend
 *     responses:
 *       201:
 *         description: Project created successfully
 *       403:
 *         description: Forbidden (Requires Workspace Admin/Owner)
 */
// POST /api/v1/workspaces/:id/projects — Create a project (Owner/Admin only)
router.post('/', requireAuth, validateBody(['name']), createProjectController);

/**
 * @swagger
 * /workspaces/{id}/projects:
 *   get:
 *     summary: List all projects in a workspace
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: List of projects
 *       403:
 *         description: Forbidden (Not a workspace member)
 */
// GET /api/v1/workspaces/:id/projects — List all projects in a workspace
router.get('/', requireAuth, getProjectsController);

/**
 * @swagger
 * /workspaces/{id}/projects/{projectId}:
 *   patch:
 *     summary: Update or archive a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: projectId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isArchived:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       403:
 *         description: Forbidden (Requires Workspace Admin/Owner)
 */
// PATCH /api/v1/workspaces/:id/projects/:projectId — Update/Archive a project (Owner/Admin only)
router.patch('/:projectId', requireAuth, updateProjectController);

/**
 * @swagger
 * /workspaces/{id}/projects/{projectId}/members:
 *   post:
 *     summary: Add a member to a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Member added successfully
 *       403:
 *         description: Forbidden (Requires Workspace Admin/Owner)
 */
// POST /api/v1/workspaces/:id/projects/:projectId/members — Add a member to a project (Owner/Admin only)
router.post('/:projectId/members', requireAuth, validateBody(['userId']), addProjectMemberController);

/**
 * @swagger
 * /workspaces/{id}/projects/{projectId}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       403:
 *         description: Forbidden (Requires Workspace Admin/Owner)
 */
// DELETE /api/v1/workspaces/:id/projects/:projectId — Delete a project (Owner/Admin only)
router.delete('/:projectId', requireAuth, deleteProjectController);

/**
 * @swagger
 * /workspaces/{id}/projects/{projectId}/activity:
 *   get:
 *     summary: Get all activity logs for a project
 *     tags: [Activity & Audit]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
// GET /api/v1/workspaces/:id/projects/:projectId/activity — List all activity in a project
router.get('/:projectId/activity', requireAuth, getProjectActivityController);

export default router;
