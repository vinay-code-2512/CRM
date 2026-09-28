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

// Fetch all tasks for a specific project
export const fetchTasks = async (projectId: string): Promise<Task[]> => {
    const response = await api.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
};

// React Query hook — caches tasks per project
export const useTasks = (projectId: string) => {
    return useQuery({
        queryKey: ['tasks', projectId],
        queryFn: () => fetchTasks(projectId),
        enabled: !!projectId,
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
