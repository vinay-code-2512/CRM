import { Request, Response, NextFunction } from 'express';
import { createTask, getTasks, getTaskById, updateTask } from '../services/task.service';

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

// ==========================================
// 2. GET ALL TASKS CONTROLLER
// ==========================================
export const getTasksController = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const userId = req.user!.userId;
    const projectId = String(req.params.projectId);
    const tasks = await getTasks(userId, projectId);
    res.status(200).json(tasks);

  }   catch (error) {
    next(error);
  }
};


// ==========================================
// 3. GET SINGLE TASK CONTROLLER
// ==========================================
export const getTaskByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const projectId = String(req.params.projectId);
    const taskId = String(req.params.taskId);
    const task = await getTaskById(userId, projectId, taskId);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. UPDATE TASK CONTROLLER
// ==========================================
export const updateTaskController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const projectId = String(req.params.projectId);
    const taskId = String(req.params.taskId);
    
    // We only extract the specific fields allowed for this endpoint
    const { title, description, priority, labels, dueDate } = req.body;

    const task = await updateTask(userId, projectId, taskId, {
      title,
      description,
      priority,
      labels,
      dueDate
    });

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};
