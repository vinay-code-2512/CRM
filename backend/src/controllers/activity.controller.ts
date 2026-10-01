import { Request, Response, NextFunction } from 'express';
import { getProjectActivity } from '../services/activity.service';

// ==========================================
// GET PROJECT ACTIVITY CONTROLLER
// ==========================================
export const getProjectActivityController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extract the authenticated user's ID from the JWT payload
        const userId = req.user!.userId;
        
        // 2. Extract the projectId from the URL path (e.g., /projects/10/activity)
        const projectId = String(req.params.projectId);

        // 3. Extract pagination with sensible, safe defaults (reusing the task controller pattern)
        // Ensure page is at least 1
        const page = Math.max(1, Number(req.query.page) || 1);
        // Ensure limit is between 1 and 100 to prevent database overload
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

        // 4. Pass the extracted data to our Activity Service
        const result = await getProjectActivity(userId, projectId, { page, limit });

        // 5. Send the paginated result back to the user with a 200 OK status
        res.status(200).json(result);

    } catch (error) {
        // 6. If the service threw a 404 or 403 error, pass it to the global error handler
        next(error);
    }
};
