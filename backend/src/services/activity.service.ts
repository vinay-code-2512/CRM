import { ActivityLogModel, ActivityLogCreateInput } from '../models/ActivityLogPrisma';
import { ProjectModel } from '../models/ProjectPrisma';
import { ProjectMemberModel } from '../models/ProjectMemberPrisma';


/*
 * 1. // LOG ACTIVITY
 * Records an audit event without allowing logging failures
 * to break the main business operation.
 * Called by other services to record an audit trail event.
 * If the database fails to write the log, it catches the error and 
 * logs it to the console rather than failing the user's primary action.
 */

export const logActivity = async (input: ActivityLogCreateInput): // Pass all activity details as one object
    Promise<void> => {
    try {
        await ActivityLogModel.create(input)
    } catch (error) {
        console.error('Audit Log Failure', error)
    }
}

/**
 * 2. GET PROJECT ACTIVITY (Paginated)
 * Retrieves the audit trail for a specific project.
 */
export const getProjectActivity = async (
    requesterId: string,
    projectId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
    
) => {

    const pId = Number(projectId);
    const uId = Number(requesterId);
    // Verify project exists
    const project = await ProjectModel.findById(pId);
    if (!project) {
        const error: any = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    // Authorize: Deny access if the user is not a member of the project
    const membership = await ProjectMemberModel.findByProjectAndUser(pId, uId);
    if (!membership) {
        const error: any = new Error('Access denied. You must be a project member to view activity.');
        error.statusCode = 403;
        throw error;
    }

    // Calculate how many records to skip for the requested page
    const offset = (pagination.page - 1) * pagination.limit;
    
    // Retrieve activity data
    const { data, total } = await ActivityLogModel.findByProjectPaginated(
        pId, 
        pagination.limit, 
        offset
    );

    // Return using the exact SyncForge pagination response structure
    return {
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
        }
    };
};
