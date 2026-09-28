import { useQuery } from '@tanstack/react-query';
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
