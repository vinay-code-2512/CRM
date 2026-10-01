import { CommentModel } from '../models/CommentPrisma';
import { TaskModel } from '../models/TaskPrisma';
import { ProjectMemberModel } from '../models/ProjectMemberPrisma';
import { logActivity } from './activity.service';

// ==========================================
// HELPER: Verify the user has access to the task's project
// ==========================================
const verifyTaskAccess = async (taskId: number, requesterId: number) => {
  // 1. Check the task exists
  const task = await TaskModel.findById(taskId);
  if (!task) {
    const error: any = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check the requester is a member of the project that owns this task
  const membership = await ProjectMemberModel.findByProjectAndUser(task.projectId, requesterId);
  if (!membership) {
    const error: any = new Error('Access denied. You must be a project member to comment.');
    error.statusCode = 403;
    throw error;
  }

  return task;
};

// ==========================================
// 1. CREATE COMMENT
// ==========================================
export const createComment = async (requesterId: string, taskId: string, content: string) => {
  // Capture the returned task object so we can use its projectId
  const task = await verifyTaskAccess(Number(taskId), Number(requesterId));

  // Create the comment
  const comment = await CommentModel.create({
    taskId: Number(taskId),
    userId: Number(requesterId),
    content,
  });

  // Log that a comment was created
  logActivity({
    // Omit workspaceId because it requires an extra DB query
    projectId: task.projectId, 
    actorId: Number(requesterId),
    action: 'COMMENT_CREATED',
    targetEntity: 'Comment',
    targetId: comment.id,
    metadata: { 
      taskId: task.id,
      // Provide a short preview of the comment for the frontend UI
      snippet: content.substring(0, 50) 
    }
  });

  return comment;
};

// ==========================================
// 2. GET ALL COMMENTS FOR A TASK
// ==========================================
export const getComments = async (requesterId: string, taskId: string) => {
  // Verify the user can access this task
  await verifyTaskAccess(Number(taskId), Number(requesterId));

  // Fetch all comments for this task
  const comments = await CommentModel.findByTaskId(Number(taskId));
  return comments;
};

// ==========================================
// 3. UPDATE COMMENT (only the author can edit)
// ==========================================
export const updateComment = async (requesterId: string, commentId: string, content: string) => {
  // 1. Find the comment
  const comment = await CommentModel.findById(Number(commentId));
  if (!comment) {
    const error: any = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Only the person who wrote it can edit it
  if (comment.userId !== Number(requesterId)) {
    const error: any = new Error('You can only edit your own comments.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Update the content
  const updated = await CommentModel.update(Number(commentId), { content });
  return updated;
};

// ==========================================
// 4. DELETE COMMENT (author OR admin can delete)
// ==========================================
export const deleteComment = async (requesterId: string, commentId: string) => {
  // 1. Find the comment
  const comment = await CommentModel.findById(Number(commentId));
  if (!comment) {
    const error: any = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  // 2. Only the author can delete their comment
  // (Admin moderation can be added later by checking workspace role)
  if (comment.userId !== Number(requesterId)) {
    const error: any = new Error('You do not have permission to delete this comment.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Delete it
  await CommentModel.delete(Number(commentId));
};
