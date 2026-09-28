import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// 4. The data we need to send to the backend to create a project
export interface CreateProjectData {
    workspaceId: string; // The backend MUST know which workspace this project goes into!
    name: string;
    description?: string;
}

// 5. The actual API call to the backend
export const createProject = async (data: CreateProjectData): Promise<Project> => {
    // We send a POST request with the workspace ID right in the URL!
    const response = await api.post<Project>(`/workspaces/${data.workspaceId}/projects`, data);
    return response.data;
};

// 6. The React Query hook for creating projects
export const useCreateProject = () => {
    // We need the queryClient so we can tell it to refresh the projects list later
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: createProject,
        onSuccess: (_, variables) => {
            // When successful, tell React Query to fetch the projects again!
            // Notice we pass variables.workspaceId so it only refreshes the specific workspace we are looking at.
            queryClient.invalidateQueries({ queryKey: ['projects', variables.workspaceId] });
        },
    });
};
