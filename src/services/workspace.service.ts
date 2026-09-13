import { WorkspaceModel } from '../models/WorkspacePrisma';
import { WorkspaceMemberModel } from '../models/WorkspaceMemberPrisma';
import { UserModel } from '../models/UserPrisma';


export const createWorkspace = async (userId: string, data: {
    name: string; description: string
}) => {
    const workspace = await WorkspaceModel.create({
        name: data.name,
        description: data.description,
    })

    await WorkspaceMemberModel.create({
        workspaceId: workspace.id,
        userId: Number(userId),
        role: 'Owner'
    })

    return workspace

}

export const getUserWorkspaces = async (userId: string) => {

    const memberships = await WorkspaceMemberModel.findByUserId(Number(userId))
    const workspaceIds = memberships.map((m) => m.workspaceId)

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

export const addWorkspaceMember = async (requesterId: string, workspaceId: string, targetEmail: string, role: string) => {
    // 1. Authorize Requester
    const requesterMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(Number(workspaceId), Number(requesterId));
    if (!requesterMembership) {
        const error: any = new Error('Access denied. You are not a member of this workspace.');
        error.statusCode = 403;
        throw error;
    }

    if (requesterMembership.role === 'Member') {
        const error: any = new Error('Access denied. Only Owners and Admins can add members.');
        error.statusCode = 403;
        throw error;
    }

    // 2. Validate Target Role
    if (role !== 'Admin' && role !== 'Member') {
        const error: any = new Error('Invalid role. Can only assign Admin or Member.');
        error.statusCode = 400;
        throw error;
    }

    // 3. Find Target User
    const targetUser = await UserModel.findByEmail(targetEmail);
    if (!targetUser) {
        const error: any = new Error('User not found or not registered.');
        error.statusCode = 404;
        throw error;
    }

    // 4. Check for Duplicate Membership
    const existingMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(Number(workspaceId), targetUser.id);
    if (existingMembership) {
        const error: any = new Error('User is already a member of this workspace.');
        error.statusCode = 400;
        throw error;
    }

    // 5. Add Member
    const newMembership = await WorkspaceMemberModel.create({
        workspaceId: Number(workspaceId),
        userId: targetUser.id,
        role: role as 'Admin' | 'Member'
    });

    return newMembership;
};

export const removeWorkspaceMember = async (requesterId: string, workspaceId: string, targetUserId: string) => {
    // 1. Find Target Membership
    const targetMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(Number(workspaceId), Number(targetUserId));
    if (!targetMembership) {
        const error: any = new Error('User is not a member of this workspace.');
        error.statusCode = 404;
        throw error;
    }

    // 2. Protect the Owner from Deletion
    if (targetMembership.role === 'Owner') {
        const error: any = new Error('Cannot remove the Workspace Owner.');
        error.statusCode = 400;
        throw error;
    }

    // 3. Authorize the Requester
    const requesterMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(Number(workspaceId), Number(requesterId));
    if (!requesterMembership) {
        const error: any = new Error('Access denied. You are not a member of this workspace.');
        error.statusCode = 403;
        throw error;
    }

    if (requesterMembership.role === 'Member') {
        const error: any = new Error('Access denied. Only Owners and Admins can remove members.');
        error.statusCode = 403;
        throw error;
    }

    // 4. Remove the Member (Cascade destruction is handled by DB rules/app)
    await WorkspaceMemberModel.delete(Number(workspaceId), Number(targetUserId));
};


export const deleteWorkspace = async (requesterId: string, workspaceId: string) => {
    // 1. Verify Workspace Exists FIRST
    const workspace = await WorkspaceModel.findById(Number(workspaceId));
    if (!workspace) {
        const error: any = new Error('Workspace not found.');
        error.statusCode = 404;
        throw error;
    }

    // 2. Authorize Requester
    const requesterMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(Number(workspaceId), Number(requesterId));
    if (!requesterMembership) {
        const error: any = new Error('Access denied. You are not a member of this workspace.');
        error.statusCode = 403;
        throw error;
    }

    // 3. Protect against Admin/Member Deletion
    if (requesterMembership.role !== 'Owner') {
        const error: any = new Error('Access denied. Only the Workspace Owner can delete the workspace.');
        error.statusCode = 403;
        throw error;
    }

    // 4. Cascade Deletion: Wipe out all Memberships first
    await WorkspaceMemberModel.deleteByWorkspaceId(Number(workspaceId));

    // 5. Destroy the Workspace
    await WorkspaceModel.delete(Number(workspaceId));
};


export const updateWorkspaceMemberRole = async (requesterId: string, workspaceId: string, targetUserId: string, targetRole: string) => {
    // 1. Target Role Validation
    if (targetRole !== 'Admin' && targetRole !== 'Member') {
        const error: any = new Error('Invalid role specified. Only Admin and Member roles can be assigned.');
        error.statusCode = 400;
        throw error;
    }

    // 2. Authorize Requester
    const requesterMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(Number(workspaceId), Number(requesterId));
    if (!requesterMembership) {
        const error: any = new Error('Access denied. You are not a member of this workspace.');
        error.statusCode = 403;
        throw error;
    }

    if (requesterMembership.role === 'Member') {
        const error: any = new Error('Access denied. Only Admins and Owners can manage roles.');
        error.statusCode = 403;
        throw error;
    }

    // 3. Find Target Membership
    const targetMembership = await WorkspaceMemberModel.findByWorkspaceAndUser(Number(workspaceId), Number(targetUserId));
    if (!targetMembership) {
        const error: any = new Error('Target user is not a member of this workspace.');
        error.statusCode = 404;
        throw error;
    }

    // 4. Protection: Cannot change Owner's role
    if (targetMembership.role === 'Owner') {
        const error: any = new Error('Cannot change the role of the Workspace Owner.');
        error.statusCode = 400;
        throw error;
    }

    // 5. Update Role
    const updatedRecord = await WorkspaceMemberModel.updateRole(Number(workspaceId), Number(targetUserId), targetRole as 'Admin' | 'Member');
    return updatedRecord;
};
