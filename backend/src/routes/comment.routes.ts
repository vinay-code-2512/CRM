import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createCommentController, getCommentsController, updateCommentController, deleteCommentController } from '../controllers/comment.controller';

const router = express.Router({ mergeParams: true }); // mergeParams lets us read :taskId from parent

// POST /api/v1/tasks/:taskId/comments — Create a new comment on a task
router.post('/', requireAuth, validateBody(['content']), createCommentController);

// GET /api/v1/tasks/:taskId/comments — Get all comments for a task
router.get('/', requireAuth, getCommentsController);

// PATCH /api/v1/tasks/:taskId/comments/:commentId — Edit your own comment
router.patch('/:commentId', requireAuth, validateBody(['content']), updateCommentController);

// DELETE /api/v1/tasks/:taskId/comments/:commentId — Delete a comment
router.delete('/:commentId', requireAuth, deleteCommentController);

export default router;
