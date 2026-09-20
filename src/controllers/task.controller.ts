import { Request, Response, NextFunction } from 'express';
import { createTask } from '../services/task.service';

// ==========================================
// 1. CREATE TASK CONTROLLER
// ==========================================
export const createTaskController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const projectId = String(req.params.projectId);
    const { title, description, priority, labels, dueDate } = req.body;

    const task = await createTask(userId, projectId, {
      title,
      description,
      priority,
      labels,
      dueDate
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};
