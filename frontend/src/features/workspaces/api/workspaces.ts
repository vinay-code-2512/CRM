import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

// 1. The exact shape of a Workspace as returned by the backend
export interface Workspace {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

// 2. The raw API function to fetch all workspaces for the logged-in user
export const fetchWorkspaces = async (): Promise<Workspace[]> => {
    // Notice we use api.get() instead of post()!
    const response = await api.get<Workspace[]>('/workspaces');
    return response.data;
};

// 3. The React Query hook
// We use useQuery (instead of useMutation) because we are FETCHING data, not changing it.
export const useWorkspaces = () => {
    return useQuery({
        // The queryKey is how React Query caches the data. 
        // If we tell it to invalidate ['workspaces'], it will automatically re-fetch!
        queryKey: ['workspaces'],
        queryFn: fetchWorkspaces,
    });
};

// 4. The data required to create a new workspace
export interface CreateWorkspaceData {
    name: string;
    description?: string;
}

// 5. The raw API function to POST a new workspace
export const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
    const response = await api.post<Workspace>('/workspaces', data);
    return response.data;
};

// 6. The React Query mutation hook for creating workspaces
export const useCreateWorkspace = () => {
    // We import queryClient so we can tell React Query to refresh the workspace list!
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: createWorkspace,
        onSuccess: () => {
            // This is the magic! The second a new workspace is created on the backend,
            // we tell React Query "Hey, the 'workspaces' data is old, go fetch it again!"
            // The UI will instantly update without a page refresh!
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
    });
};
