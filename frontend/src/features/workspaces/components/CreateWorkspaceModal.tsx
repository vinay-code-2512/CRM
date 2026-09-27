import React, { useState } from 'react';
import { useCreateWorkspace } from '../api/workspaces';
import axios from 'axios';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { mutate: createWorkspace, isPending } = useCreateWorkspace();

    if (!isOpen) return null; // Don't render anything if the modal is closed

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        createWorkspace(
            { name, description },
            {
                onSuccess: () => {
                    // Reset the form and close the modal when successful
                    setName('');
                    setDescription('');
                    onClose();
                },
                onError: (error) => {
                    if (axios.isAxiosError(error) && error.response) {
                        setErrorMessage(error.response.data.message || 'Failed to create workspace.');
                    } else {
                        setErrorMessage('An unexpected error occurred.');
                    }
                }
            }
        );
    };

    return (
        // Modal Overlay (The darkened background)
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            
            {/* Modal Content Box */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                
                {/* Modal Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Create New Workspace</h3>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body (The Form) */}
                <form onSubmit={handleSubmit} className="p-6">
                    
                    {errorMessage && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="workspace-name" className="block text-sm font-medium text-slate-700 mb-1">
                                Workspace Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="workspace-name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400"
                                placeholder="e.g., Marketing Team"
                            />
                        </div>

                        <div>
                            <label htmlFor="workspace-description" className="block text-sm font-medium text-slate-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="workspace-description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 resize-none"
                                placeholder="What is this workspace for?"
                            />
                        </div>
                    </div>

                    {/* Modal Footer (Buttons) */}
                    <div className="mt-8 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !name.trim()}
                            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md shadow-indigo-600/20 ${(isPending || !name.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isPending ? 'Creating...' : 'Create Workspace'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
