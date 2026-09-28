import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface Project {
    id: number;
    workspaceId: number;
    name: string;
    description?: string;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
}

export const fetchProjects = async (workspaceId: string): Promise<Project[]> => {
    const response = await api.get<Project[]>(`/workspaces/${workspaceId}/projects`);
    return response.data;
};

export const useProjects = (workspaceId: string) => {
    return useQuery({
        // Include workspaceId in the key to cache projects per workspace
        queryKey: ['projects', workspaceId],
        queryFn: () => fetchProjects(workspaceId),
        enabled: !!workspaceId,
    });
};
