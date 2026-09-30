import { Request, Response, NextFunction } from 'express';
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from '../services/task.service';

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
// 2. GET ALL TASKS CONTROLLER (with Search, Filter, Pagination)
// ==========================================
export const getTasksController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const projectId = String(req.params.projectId);

    // Extract optional filters from query string
    // const filters: { ... } -> The variable filters has this TypeScript type.
    // const filters: { ... } -> filters must be an object having the specified structure.
    const filters: {
      status?: string;
      priority?: string;
      assigneeId?: number;
      search?: string
    } = {}; //{} -> Create a filters object, with the specified TypeScript structure, and initially make it empty.

    // Express provides req.query to access query 
    // parameters(?status=Todo&priority=High) from the URL.
    if (req.query.status)
      filters.status = String(req.query.status);
    if (req.query.priority)
      filters.priority = String(req.query.priority);
    if (req.query.assigneeId)
      filters.assigneeId = Number(req.query.assigneeId);
    if (req.query.search)
      filters.search = String(req.query.search);

    // Extract pagination with sensible defaults
    // Get the requested page number, but never allow page to be less than 1
    // req.query.page -> This comes from the URL(GET /projects/10/tasks?page=3)
    const page = Math.max(1, Number(req.query.page) || 1);
    // Get how many tasks to show per page. Default is 20. Don't allow less than 1 or more than 100.
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const result = await getTasks(userId, projectId, filters, { page, limit });
    res.status(200).json(result);

  } catch (error) {
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

    // NEW: We added status here so the controller extracts it from the request body
    const { title, description, priority, status, labels, dueDate, assigneeId } = req.body;

    const task = await updateTask(userId, projectId, taskId, {
      title,
      description,
      priority,
      status,
      labels,
      dueDate,
      assigneeId
    });

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. DELETE TASK CONTROLLER
// ==========================================
export const deleteTaskController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const projectId = String(req.params.projectId);
    const taskId = String(req.params.taskId);

    await deleteTask(userId, projectId, taskId);

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
