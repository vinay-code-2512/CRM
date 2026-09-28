import React, { useState } from 'react';
import { useCreateProject } from '../api/projects';
import axios from 'axios';

// These are the "Props" (properties) that we must pass to this component when we use it
interface CreateProjectModalProps {
    isOpen: boolean;       // Is the modal currently visible? (true/false)
    onClose: () => void;   // Function to run when we want to close the modal
    workspaceId: string;   // The ID of the workspace we are currently looking at
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, workspaceId }) => {
    // Store what the user types into the input boxes
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    // Store any error messages if the backend rejects our request
    const [errorMessage, setErrorMessage] = useState('');

    // Get our mutation hook that we just wrote in the API file
    const { mutate: createProject, isPending } = useCreateProject();

    // If the modal is closed (isOpen === false), render absolutely nothing
    if (!isOpen) return null; 

    // Handle what happens when the user clicks the "Create Project" button
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();  // Stop the page from reloading
        setErrorMessage(''); // Clear out any old errors

        // Send the data to our API
        createProject(
            { workspaceId, name, description }, // Send the workspaceId alongside what they typed!
            {
                onSuccess: () => {
                    // If it worked: Clear the form and close the modal
                    setName('');
                    setDescription('');
                    onClose();
                },
                onError: (error) => {
                    // If it failed: Look inside the error and show the message on screen
                    if (axios.isAxiosError(error) && error.response) {
                        setErrorMessage(error.response.data.message || 'Failed to create project.');
                    } else {
                        setErrorMessage('An unexpected error occurred.');
                    }
                }
            }
        );
    };

    return (
        // The dark, blurry background overlay that covers the screen
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            
            {/* The white modal box itself */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                
                {/* Header Section (Title and X button) */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Create New Project</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="p-6">
                    
                    {/* Error Message Box (Only shows if errorMessage is not empty) */}
                    {errorMessage && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name Input field */}
                        <div>
                            <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 mb-1">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="project-name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400"
                                placeholder="e.g., Website Redesign"
                            />
                        </div>

                        {/* Description Input field */}
                        <div>
                            <label htmlFor="project-description" className="block text-sm font-medium text-slate-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="project-description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 resize-none"
                                placeholder="What is this project about?"
                            />
                        </div>
                    </div>

                    {/* Footer Section (Cancel & Create Buttons) */}
                    <div className="mt-8 flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        
                        {/* Disable button if it's currently saving OR if name is empty */}
                        <button type="submit" disabled={isPending || !name.trim()} className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md shadow-indigo-600/20 ${(isPending || !name.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {isPending ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
