import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

// 1. Define the exact shape of a Comment (including our new hydrated User object!)
export interface Comment {
    id: number;
    taskId: number;
    userId: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

// 2. GET: Fetch all comments for a task
export const fetchComments = async (taskId: string): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/tasks/${taskId}/comments`);
    return response.data;
};

export const useComments = (taskId: string) => {
    return useQuery({
        queryKey: ['comments', taskId],
        queryFn: () => fetchComments(taskId),
        enabled: !!taskId,
    });
};

// 3. POST: Create a new comment
export const createComment = async (data: { taskId: string; content: string }) => {
    const response = await api.post(`/tasks/${data.taskId}/comments`, {
        content: data.content,
    });
    return response.data;
};

export const useCreateComment = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
        },
    });
};

// 4. PATCH: Update a comment
export const updateComment = async (data: { taskId: string; commentId: string; content: string }) => {
    const response = await api.patch(`/tasks/${data.taskId}/comments/${data.commentId}`, {
        content: data.content,
    });
    return response.data;
};

export const useUpdateComment = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
        },
    });
};

// 5. DELETE: Delete a comment
export const deleteComment = async (data: { taskId: string; commentId: string }) => {
    const response = await api.delete(`/tasks/${data.taskId}/comments/${data.commentId}`);
    return response.data;
};

export const useDeleteComment = (taskId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
        },
    });
};
