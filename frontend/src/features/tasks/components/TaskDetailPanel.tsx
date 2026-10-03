import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { type Task, useUpdateTask } from '../api/tasks';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '../api/comments';
import axios from 'axios';


interface TaskDetailPanelProps {
    task: Task | null;         // The task to display (null = panel is closed)
    onClose: () => void;
    projectId: string;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, onClose, projectId }) => {
    // Editable form fields — initialized from the task prop
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Todo');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');

    // Feedback
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Our update mutation
    const { mutate: updateTask, isPending } = useUpdateTask(projectId);

    // Fetch comments for the selected task
    const { data: comments, isLoading: commentsLoading } = useComments(task ? String(task.id) : '');

    // Create comment mutation and state
    const [newComment, setNewComment] = useState('');
    const { mutate: createComment, isPending: isCreatingComment } = useCreateComment(task ? String(task.id) : '');

    const handleAddComment = () => {
        if (!newComment.trim() || !task) return;
        createComment(
            { taskId: String(task.id), content: newComment },
            {
                onSuccess: () => setNewComment('') // Clear input immediately on success
            }
        );
    };

    // Get the current logged-in user
    const currentUser = useSelector((state: RootState) => state.auth.user);

    // Edit & Delete hooks / state
    const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment(task ? String(task.id) : '');
    const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteComment(task ? String(task.id) : '');
    
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleDeleteComment = (commentId: number) => {
        if (!task || !window.confirm("Are you sure you want to delete this comment?")) return;
        deleteComment({ taskId: String(task.id), commentId: String(commentId) });
    };

    const handleEditStart = (comment: any) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const handleSaveEdit = () => {
        if (!task || !editingCommentId || !editContent.trim()) return;
        updateComment(
            { taskId: String(task.id), commentId: String(editingCommentId), content: editContent },
            {
                onSuccess: () => {
                    setEditingCommentId(null);
                    setEditContent('');
                }
            }
        );
    };

    // Whenever a new task is selected, populate the form fields
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(task.priority);
            // Convert ISO date to YYYY-MM-DD for the date input
            setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
            setErrorMessage('');
            setSuccessMessage('');
        }
    }, [task]);

    // Don't render if no task is selected
    if (!task) return null;

    const handleSave = () => {
        setErrorMessage('');
        setSuccessMessage('');

        updateTask(
            {
                projectId,
                taskId: String(task.id),
                title,
                description: description || undefined,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            },
            {
                onSuccess: () => {
                    setSuccessMessage('Task updated!');
                    setTimeout(() => setSuccessMessage(''), 2000);
                },
                onError: (error) => {
                    if (axios.isAxiosError(error) && error.response) {
                        setErrorMessage(error.response.data.message || 'Failed to update task.');
                    } else {
                        setErrorMessage('An unexpected error occurred.');
                    }
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Dark overlay — click to close */}
            <div className="flex-1 bg-slate-900/40" onClick={onClose} />

            {/* Side panel sliding in from the right */}
            <div className="w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto">

                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Task Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Panel Body */}
                <div className="p-6 space-y-5 flex-1">

                    {/* Feedback Messages */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {errorMessage}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Add a description..."
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="Todo">Todo</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Review">Review</option>
                            <option value="Done">Done</option>
                        </select>
                    </div>

                    {/* Priority & Due Date on same row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Meta info: Created / Updated timestamps */}
                    <div className="pt-4 border-t border-slate-200 text-xs text-slate-400 space-y-1">
                        <p>Created: {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p>Updated: {new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    {/* Comments Section (Read-Only for now) */}
                    <div className="pt-6 border-t border-slate-200">
                        <h4 className="text-sm font-medium text-slate-700 mb-4">Comments</h4>
                        
                        {/* Add Comment Form */}
                        <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                            <textarea
                                rows={2}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-transparent text-sm text-slate-900 focus:outline-none resize-none placeholder-slate-400"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || isCreatingComment}
                                    className={`px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 ${(!newComment.trim() || isCreatingComment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isCreatingComment ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                        
                        {commentsLoading ? (
                            <div className="text-sm text-slate-500 animate-pulse">Loading comments...</div>
                        ) : !comments || comments.length === 0 ? (
                            <div className="text-sm text-slate-500 italic">No comments yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-sm text-slate-800">
                                                {comment.user?.name || 'Unknown User'}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400">
                                                    {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {currentUser && Number(currentUser._id) === comment.userId && (
                                                    <div className="flex gap-2 text-xs">
                                                        <button 
                                                            onClick={() => handleEditStart(comment)}
                                                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                            disabled={isDeletingComment || isUpdatingComment}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-red-500 hover:text-red-700 transition-colors"
                                                            disabled={isDeletingComment || isUpdatingComment}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {editingCommentId === comment.id ? (
                                            <div className="mt-2">
                                                <textarea
                                                    rows={2}
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button
                                                        onClick={() => setEditingCommentId(null)}
                                                        className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={!editContent.trim() || isUpdatingComment}
                                                        className={`px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors ${(!editContent.trim() || isUpdatingComment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {isUpdatingComment ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-700 break-words whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending || !title.trim()}
                        className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 ${(isPending || !title.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
