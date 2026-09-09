// Import Express types for req, res, next
import { Request, Response, NextFunction } from 'express';

// Import the Service functions that contain workspace business logic
import { createWorkspace, getUserWorkspaces, getWorkspaceById } from '../services/workspace.service';

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
