import React, { useState } from 'react';
import { useCreateTask } from '../api/tasks';
import axios from 'axios';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, projectId }) => {
    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');

    // Feedback messages
    const [errorMessage, setErrorMessage] = useState('');

    // Our mutation hook — automatically refreshes the task list on success
    const { mutate: createTask, isPending } = useCreateTask(projectId);

    // Don't render anything if the modal is closed
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        createTask(
            {
                projectId,
                title,
                description: description || undefined,
                priority,
                // Convert local date to ISO string for the backend
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            },
            {
                onSuccess: () => {
                    // Clear form and close the modal
                    setTitle('');
                    setDescription('');
                    setPriority('Medium');
                    setDueDate('');
                    onClose();
                },
                onError: (error) => {
                    if (axios.isAxiosError(error) && error.response) {
                        setErrorMessage(error.response.data.message || 'Failed to create task.');
                    } else {
                        setErrorMessage('An unexpected error occurred.');
                    }
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">

                {/* Modal Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Create New Task</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Error Message */}
                    {errorMessage && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Title Input (required) */}
                        <div>
                            <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="task-title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Design the login page"
                            />
                        </div>

                        {/* Description Textarea (optional) */}
                        <div>
                            <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="task-description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Describe what needs to be done..."
                            />
                        </div>

                        {/* Priority & Due Date on same row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Priority Select */}
                            <div>
                                <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    id="task-priority"
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

                            {/* Due Date Picker */}
                            <div>
                                <label htmlFor="task-due-date" className="block text-sm font-medium text-slate-700 mb-1">
                                    Due Date
                                </label>
                                <input
                                    id="task-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="mt-8 flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending || !title.trim()} className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 ${(isPending || !title.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {isPending ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
