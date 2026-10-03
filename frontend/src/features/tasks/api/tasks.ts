import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

// The exact shape of a Task as returned by the backend
export interface Task {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    status: string;           // 'Todo', 'In Progress', 'Review', 'Done'
    priority: string;         // 'Low', 'Medium', 'High', 'Urgent'
    labels: string[] | null;
    dueDate: string | null;
    assigneeId: number | null;
    createdAt: string;
    updatedAt: string;
}

// Data we send to the backend when creating a task
export interface CreateTaskData {
    projectId: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
}

// Parameters we can send to filter or paginate the tasks
export interface TaskFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    assigneeId?: number;
}

// The exact shape of the paginated response from the backend
export interface PaginatedTaskResponse {
    data: Task[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Fetch tasks for a project, now supporting search, filters, and pagination
export const fetchTasks = async (projectId: string, filters: TaskFilters = {}): Promise<PaginatedTaskResponse> => {
    // Axios will automatically append the filters as query strings (e.g., ?page=1&status=Done)
    const response = await api.get<PaginatedTaskResponse>(`/projects/${projectId}/tasks`, {
        params: filters
    });
    return response.data;
};

// React Query hook — automatically refetches when the projectId or filters change
export const useTasks = (projectId: string, filters: TaskFilters = {}) => {
    return useQuery({
        // Adding filters here ensures different searches are cached separately
        queryKey: ['tasks', projectId, filters],       //WHAT data?
        queryFn: () => fetchTasks(projectId, filters), //HOW to get it?
        enabled: !!projectId,                          // WHEN/WHETHER to run?
    });
};


// Create a new task inside a project
export const createTask = async (data: CreateTaskData) => {
    const response = await api.post(`/projects/${data.projectId}/tasks`, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
    });
    return response.data;
};

// Mutation hook — auto-refreshes the task list after creating
export const useCreateTask = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            // Refetch the task list so the new task appears instantly
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
};

// Data we send when updating an existing task
export interface UpdateTaskData {
    projectId: string;
    taskId: string;
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    assigneeId?: string | null;
}

// Update an existing task (PATCH)
export const updateTask = async (data: UpdateTaskData) => {
    const { projectId, taskId, ...fields } = data;
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}`, fields);
    return response.data;
};

// Mutation hook — auto-refreshes the task list after updating
export const useUpdateTask = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
};
