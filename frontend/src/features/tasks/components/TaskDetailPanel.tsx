import React, { useState, useEffect } from 'react';
import { type Task, useUpdateTask } from '../api/tasks';
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
