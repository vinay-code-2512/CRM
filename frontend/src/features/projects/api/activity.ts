import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
// Represents a single activity event returned by the backend
export interface ActivityLog {
    id: number;
    workspaceId: number | null;
    projectId: number;
    actorId: number;
    action: string;
    targetEntity: string;
    targetId: number;
    metadata: any;
    createdAt: string;
}

// The exact shape of the paginated response from the backend
export interface PaginatedActivityResponse {
    data: ActivityLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}


// Fetch paginated activity logs for a specific project
export const fetchProjectActivity = async (
    workspaceId: string,
    projectId: string,
    page: number = 1,
    limit: number = 20
): Promise<PaginatedActivityResponse> => {
    // Send a GET request with page and limit as query parameters
    const response = await api.get<PaginatedActivityResponse>(
        `/workspaces/${workspaceId}/projects/${projectId}/activity`,
        { params: { page, limit } }
    );
    return response.data;
};

// React Query hook to easily fetch and cache the activity data in our components
export const useProjectActivity = (workspaceId: string, projectId: string, page: number = 1, limit: number = 20) => {
    return useQuery({
        // The query key uniquely identifies this specific data request in the cache
        queryKey: ['activity', workspaceId, projectId, page, limit],
        // The function that actually performs the network request
        queryFn: () => fetchProjectActivity(workspaceId, projectId, page, limit),
        // Only run the query if we have valid IDs
        enabled: !!workspaceId && !!projectId,
    });
};