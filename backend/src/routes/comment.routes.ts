import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createCommentController, getCommentsController, updateCommentController, deleteCommentController } from '../controllers/comment.controller';

const router = express.Router({ mergeParams: true }); // mergeParams lets us read :taskId from parent

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   post:
 *     summary: Create a new comment on a task
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: I've started working on the frontend integration for this.
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       403:
 *         description: Forbidden (Not a project member)
 */
// POST /api/v1/tasks/:taskId/comments — Create a new comment on a task
router.post('/', requireAuth, validateBody(['content']), createCommentController);

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: List of comments on the task
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       403:
 *         description: Forbidden (Not a project member)
 */
// GET /api/v1/tasks/:taskId/comments — Get all comments for a task
router.get('/', requireAuth, getCommentsController);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   patch:
 *     summary: Edit your own comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: I've finished the frontend integration!
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       403:
 *         description: Forbidden (Can only edit your own comment)
 *       404:
 *         description: Comment not found
 */
// PATCH /api/v1/tasks/:taskId/comments/:commentId — Edit your own comment
router.patch('/:commentId', requireAuth, validateBody(['content']), updateCommentController);

/**
 * @swagger
 * /tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Forbidden (Can only delete your own comment)
 *       404:
 *         description: Comment not found
 */
// DELETE /api/v1/tasks/:taskId/comments/:commentId — Delete a comment
router.delete('/:commentId', requireAuth, deleteCommentController);

export default router;
