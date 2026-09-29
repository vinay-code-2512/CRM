import { Request, Response, NextFunction } from 'express';
import { createComment, getComments, updateComment, deleteComment } from '../services/comment.service';

// ==========================================
// 1. CREATE COMMENT CONTROLLER
// ==========================================
export const createCommentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const taskId = String(req.params.taskId);
    const { content } = req.body;

    const comment = await createComment(userId, taskId, content);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET ALL COMMENTS FOR A TASK
// ==========================================
export const getCommentsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const taskId = String(req.params.taskId);

    const comments = await getComments(userId, taskId);
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. UPDATE COMMENT CONTROLLER
// ==========================================
export const updateCommentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const commentId = String(req.params.commentId);
    const { content } = req.body;

    const comment = await updateComment(userId, commentId, content);
    res.status(200).json(comment);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. DELETE COMMENT CONTROLLER
// ==========================================
export const deleteCommentController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const commentId = String(req.params.commentId);

    await deleteComment(userId, commentId);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};
