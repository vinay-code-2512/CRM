import { TaskModel } from '../models/TaskPrisma';
import { ProjectModel } from '../models/ProjectPrisma';
import { ProjectMemberModel } from '../models/ProjectMemberPrisma';

// ==========================================
// 1. CREATE TASK
// ==========================================
export const createTask = async (
  requesterId: string,
  projectId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    labels?: string[];
    dueDate?: string;
  }
) => {
  // 1. Verify the project exists (WHY: Can't create a task in a project that doesn't exist)
  const project = await ProjectModel.findById(Number(projectId));
  if (!project) {
    const error: any = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Verify the project is not archived (WHY: You shouldn't be adding work to a dead project)
  if (project.isArchived) {
    const error: any = new Error('Cannot create tasks in an archived project.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Authorize: Only Project Members can create tasks
  // (WHY: This is different from Projects where Owner/Admin could do things.
  //  For Tasks, you MUST be explicitly added to the project first.)
  const membership = await ProjectMemberModel.findByProjectAndUser(
    project.id,
    Number(requesterId)
  );
  if (!membership) {
    const error: any = new Error('Access denied. You must be a project member to create tasks.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Create the task in the database
  const task = await TaskModel.create({
    projectId: project.id,
    title: data.title,
    description: data.description || null,
    priority: data.priority || 'Medium',
    labels: data.labels || null,
    dueDate: data.dueDate ? (globalThis as any).Temporal.Instant.from(data.dueDate) : null,

  });

  return task;
};
