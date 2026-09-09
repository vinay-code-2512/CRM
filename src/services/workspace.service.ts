import { WorkspaceModel } from '../models/WorkspacePrisma'
import { WorkspaceMemberModel } from '../models/WorkspaceMemberPrisma'

export const createWorkspace = async (userId:string, data:{
    name:string;  description:string }) => {
        const workspace = await WorkspaceModel.create({
            name:data.name,
            description:data.description,
        })

        await WorkspaceMemberModel.create({
            workspaceId: workspace.id,
            userId: Number(userId),
            role:'Owner'
        })

        return workspace

} 

export const getUserWorkspaces = async (userId:string) => {

    const memberships = await WorkspaceMemberModel.findByUserId(Number(userId))
    const workspaceIds = memberships.map( (m) => m.workspaceId)

    const workspaces = await WorkspaceModel.findByIds(workspaceIds)
    return workspaces
}

export const getWorkspaceById = async (workspaceId: string, userId: string) => {
    // PERMISSION CHECK: Is this user a member of this workspace?
    const membership = await WorkspaceMemberModel.findByWorkspaceAndUser(
        Number(workspaceId), Number(userId)
    );
    if (!membership) {
        const error: any = new Error('Access denied. You are not a member of this workspace.');
        error.statusCode = 403;
        throw error;
    }
    // Fetch the workspace
    const workspace = await WorkspaceModel.findById(Number(workspaceId));
    if (!workspace) {
        const error: any = new Error('Workspace not found');
        error.statusCode = 404;
        throw error;
    }
    return workspace;
};
