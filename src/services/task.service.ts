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


// ==========================================
// 2. GET ALL TASKS FOR A PROJECT
// ==========================================
export const getTasks = async (requesterId: string, projectId: string) => {
  // 1. Verify project exists
  const project = await ProjectModel.findById(Number(projectId));
  if (!project) {
    const error: any = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Authorize: Only Project Members can view tasks
  const membership = await ProjectMemberModel.findByProjectAndUser(
    project.id,
    Number(requesterId)
  );
  if (!membership) {
    const error: any = new Error('Access denied. You must be a project member to view tasks.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Fetch all tasks
  const tasks = await TaskModel.findByProjectId(project.id);
  return tasks;
};

// ==========================================
// 3. GET A SINGLE TASK BY ID
// ==========================================
export const getTaskById = async (requesterId: string, projectId: string, taskId: string) => {
  // 1. Fetch the task first to make sure it exists
  const task = await TaskModel.findById(Number(taskId));
  if (!task) {
    const error: any = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Make sure the task actually belongs to the project in the URL
  if (task.projectId !== Number(projectId)) {
    const error: any = new Error('Task does not belong to this project');
    error.statusCode = 400;
    throw error;
  }

  // 3. Authorize: Only Project Members can view it
  const membership = await ProjectMemberModel.findByProjectAndUser(
    Number(projectId),
    Number(requesterId)
  );
  if (!membership) {
    const error: any = new Error('Access denied. You must be a project member to view tasks.');
    error.statusCode = 403;
    throw error;
  }

  return task;
};


// ==========================================
// 4. UPDATE TASK FIELDS
// ==========================================
export const updateTask = async (
  requesterId: string,
  projectId: string,
  taskId: string,
  updateData: {
    title?: string;
    description?: string;
    priority?: string;
    labels?: string[];
    dueDate?: string | null;
  }
) => {
  // 1. Fetch the task first to make sure it exists
  const task = await TaskModel.findById(Number(taskId));
  if (!task) {
    const error: any = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Make sure the task actually belongs to the project in the URL
  if (task.projectId !== Number(projectId)) {
    const error: any = new Error('Task does not belong to this project');
    error.statusCode = 400;
    throw error;
  }

  // 3. Authorize: Only Project Members can update tasks
  const membership = await ProjectMemberModel.findByProjectAndUser(
    Number(projectId),
    Number(requesterId)
  );
  if (!membership) {
    const error: any = new Error('Access denied. You must be a project member to update tasks.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Format dates correctly if dueDate is being updated
  const formattedData: any = { ...updateData };
  if (updateData.dueDate) {
    formattedData.dueDate = (globalThis as any).Temporal.Instant.from(updateData.dueDate);
  } else if (updateData.dueDate === null) {
    // Allow users to clear the due date by explicitly sending null
    formattedData.dueDate = null;
  }

  // 5. Update the task in the database
  const updatedTask = await TaskModel.update(Number(taskId), formattedData);
  return updatedTask;
};
