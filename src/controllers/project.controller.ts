import { Request, Response, NextFunction } from 'express';
import { createProject, getProjects } from '../services/project.service';

// ==========================================
// 1. CREATE PROJECT CONTROLLER
// ==========================================
export const createProjectController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const workspaceId = String(req.params.id);
    const { name, description } = req.body;

    const project = await createProject(userId, workspaceId, { name, description });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET PROJECTS CONTROLLER
// ==========================================
export const getProjectsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const workspaceId = String(req.params.id);

    const projects = await getProjects(userId, workspaceId);

    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};
