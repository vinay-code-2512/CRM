import { TaskModel } from '../models/TaskPrisma';
import { ProjectModel } from '../models/ProjectPrisma';
import { ProjectMemberModel } from '../models/ProjectMemberPrisma';
import { logActivity } from './activity.service';


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

  // Log that this task was created
    logActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorId: Number(requesterId),
    action: 'TASK_CREATED',
    targetEntity: 'Task',
    targetId: task.id,
    metadata: { title: task.title }
  });

  return task;
};


// ==========================================
// 2. GET ALL TASKS FOR A PROJECT
// ==========================================
export const getTasks = async (
  requesterId: string,
  projectId: string,
  filters: {
    status?: string; priority?: string; assigneeId?: number;
    search?: string } = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 20 }

) => {

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


 
  // 3. Calculate the offset from the page number
  // Page 1 = skip 0, Page 2 = skip 20, Page 3 = skip 40, etc.
  const offset = (pagination.page - 1) * pagination.limit;

  // 4. Run TWO database operations in parallel:
  //    - Fetch the filtered & paginated page of tasks
  //    - Count the total matching rows via SQL COUNT(*) (no rows loaded into memory)
  // Promise.all() is a built-in JS func that waits for multiple promises
  // [tasks,total]->The results from Promise.all() are returned in the same order as the promises.
  
  const [tasks, total] = await Promise.all([
    TaskModel.searchAndFilter(  //give tasks for requested page
      project.id,
      filters,
      { limit: pagination.limit, offset }
    ),
    // How many tasks match these filters in total?
    TaskModel.countFiltered(project.id, filters),
  ]);

  // 5. Return data + pagination metadata so the frontend can build page controls
  return {
    data: tasks,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
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
// 4. UPDATE TASK FIELDS (Including Assignment & Status)
// ==========================================
export const updateTask = async (
  requesterId: string,
  projectId: string,
  taskId: string,
  updateData: {
    title?: string;
    description?: string;
    priority?: string;
    status?: string; // NEW: Added status support
    labels?: string[];
    dueDate?: string | null;
    assigneeId?: string | null; // NEW: Added assigneeId support
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

  // NEW SECURITY CHECK: If they are trying to assign the task to someone, 
  // we MUST verify that the assignee is actually part of this project.
  if (updateData.assigneeId) {
    const assigneeMembership = await ProjectMemberModel.findByProjectAndUser(
      Number(projectId),
      Number(updateData.assigneeId)
    );

    if (!assigneeMembership) {
      const error: any = new Error('Cannot assign task: Target user is not a member of this project.');
      error.statusCode = 400; // Bad Request, because they gave us an invalid assignee
      throw error;
    }
  }

  // NEW SECURITY CHECK: Validate status if provided
  if (updateData.status) {
    const validStatuses = ['Todo', 'In Progress', 'Review', 'Done'];
    if (!validStatuses.includes(updateData.status)) {
      const error: any = new Error('Invalid status. Allowed values are: Todo, In Progress, Review, Done');
      error.statusCode = 400;
      throw error;
    }
  }

  // NEW SECURITY CHECK: Validate priority if provided
  if (updateData.priority) {
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    if (!validPriorities.includes(updateData.priority)) {
      const error: any = new Error('Invalid priority. Allowed values are: Low, Medium, High, Urgent');
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Format dates correctly if dueDate is being updated
  const formattedData: any = { ...updateData };
  if (updateData.dueDate) {
    formattedData.dueDate = (globalThis as any).Temporal.Instant.from(updateData.dueDate);
  } else if (updateData.dueDate === null) {
    formattedData.dueDate = null;
  }

  // Convert assigneeId string to a number for Prisma, or null to unassign
  if (updateData.assigneeId) {
    formattedData.assigneeId = Number(updateData.assigneeId);
  } else if (updateData.assigneeId === null) {
    formattedData.assigneeId = null;
  }

  // 5. Update the task in the database
  const updatedTask = await TaskModel.update(Number(taskId), formattedData);

  // Log that this task was updated
  logActivity({
    // workspaceId is an optional field in our ActivityLogCreateInput.
    projectId: task.projectId, 
    actorId: Number(requesterId),
    action: 'TASK_UPDATED',
    targetEntity: 'Task',
    targetId: task.id,
    metadata: { 
      // Record which fields were changed
      updatedFields: Object.keys(updateData),
      newStatus: updateData.status,
      newAssignee: updateData.assigneeId
    }
  });

  return updatedTask;
};

// ==========================================
// 5. DELETE TASK
// ==========================================
export const deleteTask = async (requesterId: string, projectId: string, taskId: string) => {
  // 1. Fetch the task to ensure it actually exists
  const task = await TaskModel.findById(Number(taskId));
  if (!task) {
    const error: any = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Ensure the task belongs to the project specified in the URL
  // This prevents users from deleting a task from Project B while pretending to be in Project A
  if (task.projectId !== Number(projectId)) {
    const error: any = new Error('Task does not belong to this project');
    error.statusCode = 400;
    throw error;
  }

  // 3. Security: Check if the person requesting the deletion is a member of this project
  const membership = await ProjectMemberModel.findByProjectAndUser(
    Number(projectId),
    Number(requesterId)
  );

  if (!membership) {
    const error: any = new Error('Access denied. You must be a project member to delete tasks.');
    error.statusCode = 403;
    throw error;
  }

  // 4. Everything is verified! Delete the task from the database.
  await TaskModel.delete(Number(taskId));
};
