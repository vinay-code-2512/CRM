import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createWorkspaceController, getWorkspacesController, getWorkspaceByIdController, addWorkspaceMemberController, removeWorkspaceMemberController, deleteWorkspaceController, updateWorkspaceMemberRoleController } from '../controllers/workspace.controller';

const router = express.Router();

/**
 * @swagger
 * /workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
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
 *                 example: Design Team
 *               description:
 *                 type: string
 *                 example: Optional description
 *     responses:
 *       201:
 *         description: Workspace created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// POST /api/v1/workspaces — Create a new workspace (Protected) 
router.post('/', requireAuth, validateBody(['name']), createWorkspaceController);

/**
 * @swagger
 * /workspaces:
 *   get:
 *     summary: Get all workspaces for the current user
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: List of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Unauthorized
 */
// GET /api/v1/workspaces — Get all workspaces for the user (Protected)
router.get('/', requireAuth, getWorkspacesController);

/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     summary: Get a specific workspace by ID
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       403:
 *         description: Forbidden (Not a member)
 *       404:
 *         description: Workspace not found
 */
// GET /api/v1/workspaces/:id — Get a specific workspace by ID (Protected)
router.get('/:id', requireAuth, getWorkspaceByIdController);

/**
 * @swagger
 * /workspaces/{id}/members:
 *   post:
 *     summary: Add a registered user to the workspace
 *     tags: [Workspaces]
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
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *                 example: colleague@example.com
 *               role:
 *                 type: string
 *                 enum: [Admin, Member]
 *                 example: Member
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: User not found or already a member
 *       403:
 *         description: Forbidden (Requires Admin/Owner role)
 */
// POST /api/v1/workspaces/:id/members — Add a registered user to the workspace (Protected)
router.post('/:id/members', requireAuth, validateBody(['email', 'role']), addWorkspaceMemberController);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from the workspace
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Forbidden (Requires Admin/Owner role)
 *       404:
 *         description: Member not found
 */
// DELETE /api/v1/workspaces/:workspaceId/members/:userId — Remove a member from the workspace (Protected)
router.delete('/:workspaceId/members/:userId', requireAuth, removeWorkspaceMemberController);

/**
 * @swagger
 * /workspaces/{id}:
 *   delete:
 *     summary: Delete a workspace
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace deleted successfully
 *       403:
 *         description: Forbidden (Requires Owner role)
 *       404:
 *         description: Workspace not found
 */
// DELETE /api/v1/workspaces/:id — Delete a workspace (Protected)
router.delete('/:id', requireAuth, deleteWorkspaceController);

/**
 * @swagger
 * /workspaces/{workspaceId}/members/{userId}/role:
 *   patch:
 *     summary: Update workspace member role
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [Admin, Member]
 *                 example: Admin
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Forbidden (Requires Owner role)
 */
// US-10.1: Update workspace member role
router.patch('/:workspaceId/members/:userId/role', requireAuth, updateWorkspaceMemberRoleController);

export default router;
