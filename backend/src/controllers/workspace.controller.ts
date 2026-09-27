// Import Express types for req, res, next
import { Request, Response, NextFunction } from 'express';

// Import the Service functions that contain workspace business logic
import { createWorkspace, getUserWorkspaces, getWorkspaceById, addWorkspaceMember, removeWorkspaceMember, deleteWorkspace, updateWorkspaceMemberRole } from '../services/workspace.service';

// ==========================================
// 1. CREATE WORKSPACE CONTROLLER
// ==========================================
export const createWorkspaceController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: The Bouncer (auth.middleware) already verified the token and gave us the ID!
        // HOW: We grab it directly from the envelope (req.user.userId).
        const userId = req.user!.userId;

        // WHAT: Extract workspace details from the request body.
        // WHY: 'name' is required (validated by validateBody middleware), 'description' is optional.
        const { name, description } = req.body;

        // HOW: The Manager hands the userId and workspace data to the Worker (Service).
        // The Worker creates the workspace AND makes the creator the Owner automatically.
        const workspace = await createWorkspace(userId, { name, description });

        // PURPOSE: Send back the created workspace with 201 (Created) status.
        res.status(201).json(workspace);
    } catch (error) {
        // SECURITY CHECK: If anything goes wrong, slide the error to the Global Error Handler.
        next(error);
    }
};

// ==========================================
// 2. GET WORKSPACES CONTROLLER
// ==========================================
export const getWorkspacesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: Grab the ID from the Bouncer
        const userId = req.user!.userId;

        // HOW: The Manager asks the Worker to get all workspaces for this user
        const workspaces = await getUserWorkspaces(userId);

        // PURPOSE: Return the list of workspaces with a 200 OK status
        res.status(200).json(workspaces);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. GET WORKSPACE BY ID CONTROLLER
// ==========================================
export const getWorkspaceByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const workspaceId = String(req.params.id);

        const workspace = await getWorkspaceById(workspaceId, userId);

        res.status(200).json(workspace);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. ADD WORKSPACE MEMBER CONTROLLER
// ==========================================
export const addWorkspaceMemberController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: Grab the Bouncer's verified user ID (the requester)
        const requesterId = req.user!.userId;

        // WHAT: Grab the target Workspace ID from the URL (/workspaces/:id/members)
        const workspaceId = String(req.params.id);

        // WHAT: Grab the payload from the body
        // WHY: We expect 'email' and 'role' to be provided and validated by middleware.
        const { email, role } = req.body;

        // HOW: Hand the data off to the Service (the Worker) to do the heavy lifting
        const newMembership = await addWorkspaceMember(requesterId, workspaceId, email, role);

        // PURPOSE: Return the newly created membership record with a 201 (Created) status
        res.status(201).json(newMembership);
    } catch (error) {
        // SECURITY CHECK: Slide any business logic errors to the Global Error Handler
        next(error);
    } 
};

// ==========================================
// 5. REMOVE WORKSPACE MEMBER CONTROLLER
// ==========================================
export const removeWorkspaceMemberController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: Grab the Bouncer's verified user ID (the requester)
        const requesterId = req.user!.userId;

        // WHAT: Grab both the target Workspace ID and target User ID from the URL (/workspaces/:workspaceId/members/:userId)
        const workspaceId = String(req.params.workspaceId);
        const userId = String(req.params.userId);

        // HOW: Hand the IDs off to the Service (the Worker) to execute the business rules
        await removeWorkspaceMember(requesterId, workspaceId, userId);

        // PURPOSE: Return a success message with a 200 (OK) status
        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        // SECURITY CHECK: Slide any business logic errors to the Global Error Handler
        next(error);
    }
};

// ==========================================
// 6. DELETE WORKSPACE CONTROLLER
// ==========================================
export const deleteWorkspaceController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: Grab the Bouncer's verified user ID (the requester)
        const requesterId = req.user!.userId;

        // WHAT: Grab the target Workspace ID from the URL (/workspaces/:id)
        const workspaceId = String(req.params.id);

        // HOW: Hand the IDs off to the Service (the Worker) to execute the business rules
        await deleteWorkspace(requesterId, workspaceId);

        // PURPOSE: Return a success message with a 200 (OK) status
        res.status(200).json({ message: 'Workspace deleted successfully' });
    } catch (error) {
        // SECURITY CHECK: Slide any business logic errors to the Global Error Handler
        next(error);
    }
};

// ==========================================
// 7. UPDATE WORKSPACE MEMBER ROLE CONTROLLER
// ==========================================
export const updateWorkspaceMemberRoleController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: Grab the Bouncer's verified user ID
        const requesterId = req.user!.userId;

        // WHAT: Grab target IDs from the URL params
        const workspaceId = String(req.params.workspaceId);
        const targetUserId = String(req.params.userId);

        // WHAT: Grab the new role from the request body
        const targetRole = String(req.body.role);

        // HOW: Hand off to Service to validate business rules and update
        const updatedMember = await updateWorkspaceMemberRole(requesterId, workspaceId, targetUserId, targetRole);

        // PURPOSE: Return success response
        res.status(200).json({
            message: 'Member role updated successfully',
            member: updatedMember
        });
    } catch (error) {
        // SECURITY CHECK: Slide any errors to the Global Error Handler
        next(error);
    }
};
