import { ProjectModel } from '../models/ProjectPrisma';
import { ProjectMemberModel } from '../models/ProjectMemberPrisma';
import { WorkspaceMemberModel } from '../models/WorkspaceMemberPrisma';

export const createProject = async ( 
  requesterId: string,
  workspaceId: string,
  data: { name: string; description?: string }
) => {
  // 1. Authorize: requester must be Workspace Owner or Admin
  const requesterMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(
    Number(workspaceId),
    Number(requesterId)
  );

  if (!requesterMembership) {
    const error: any = new Error('Access denied. You are not a member of this workspace.');
    error.statusCode = 403;
    throw error;
  }

  if (requesterMembership.role === 'Member') {
    const error: any = new Error('Access denied. Only Workspace Owners and Admins can create projects.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Create the project
  const project = await ProjectModel.create({
    workspaceId: Number(workspaceId),
    name: data.name,
    description: data.description ?? null,
  });

  // 3. Auto-add creator as a Project Member
  await ProjectMemberModel.create({
    projectId: project.id,
    userId: Number(requesterId),
  });

  return project;
};

export const getProjects = async (requesterId: string, workspaceId: string) => {
  // Must be a workspace member to see projects
  const membership = await WorkspaceMemberModel.findByWorkspaceAndUser(
    Number(workspaceId),
    Number(requesterId)
  );

  if (!membership) {
    const error: any = new Error('Access denied. You are not a member of this workspace.');
    error.statusCode = 403;
    throw error;
  }

  return await ProjectModel.findByWorkspaceId(Number(workspaceId));
};


export const updateProject = async (
  requesterId: string,
  projectId: string,
  data: { name?: string; description?: string; isArchived?: boolean }
) => {
  // 1. Find the project first to verify it exists and get its workspaceId
  const project = await ProjectModel.findById(Number(projectId));
  if (!project) {
    const error: any = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Authorize: requester must be Workspace Owner or Admin of the parent workspace
  const requesterMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(
    project.workspaceId,
    Number(requesterId)
  );

  if (!requesterMembership) {
    const error: any = new Error('Access denied. You are not a member of this workspace.');
    error.statusCode = 403;
    throw error;
  }

  if (requesterMembership.role === 'Member') {
    const error: any = new Error('Access denied. Only Workspace Owners and Admins can update projects.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Format the data (convert undefined description to null if provided)
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;
  if (data.description !== undefined) updateData.description = data.description ?? null;

  // 4. Update the project
  const updatedProject = await ProjectModel.update(Number(projectId), updateData);
  return updatedProject;
};
