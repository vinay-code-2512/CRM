import { Request, Response, NextFunction } from 'express';
import { createProject, getProjects, updateProject, addProjectMember, deleteProject } from '../services/project.service';

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

// ==========================================
// 3. UPDATE PROJECT CONTROLLER
// ==========================================
export const updateProjectController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Grab the projectId from the URL params
    const projectId = String(req.params.projectId);

    // Grab the fields to update from the body
    const { name, description, isArchived } = req.body;

    const updatedProject = await updateProject(userId, projectId, {
      name,
      description,
      isArchived
    });

    res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// ======================================
//  4. ADD PROJECT MEMBER CONTROLLER
// =========================================
export const addProjectMemberController = async (req: Request, res: Response,
  next: NextFunction) => {

  try {
    const userId = req.user!.userId
    const projectId = String(req.params.projectId)
    const { userId: targetUserId } = req.body

    const member = await addProjectMember(userId, projectId,
      String(targetUserId))

    res.status(201).json({ message: "User added to project", member })

  } catch (error) {
    next(error)
  }
}


// ==========================================
// 5. DELETE PROJECT CONTROLLER
// ==========================================
export const deleteProjectController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const projectId = String(req.params.projectId);

    const result = await deleteProject(userId, projectId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
