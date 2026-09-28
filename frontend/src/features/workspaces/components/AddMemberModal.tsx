import React, { useState } from 'react';
import { useAddWorkspaceMember } from '../api/workspaces';
import axios from 'axios';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, workspaceId }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'Admin' | 'Member'>('Member');
    
    // We add a success message so the user knows it worked before closing!
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { mutate: addMember, isPending } = useAddWorkspaceMember();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        addMember(
            { workspaceId, email, role },
            {
                onSuccess: () => {
                    setSuccessMessage('Member added successfully!');
                    setEmail('');
                    
                    // Close the modal automatically after 2 seconds
                    setTimeout(() => {
                        setSuccessMessage('');
                        onClose();
                    }, 2000);
                },
                onError: (error) => {
                    if (axios.isAxiosError(error) && error.response) {
                        setErrorMessage(error.response.data.message || 'Failed to add member.');
                    } else {
                        setErrorMessage('An unexpected error occurred.');
                    }
                }
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Add Workspace Member</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Error & Success Messages */}
                    {errorMessage && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {errorMessage}
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="member-email" className="block text-sm font-medium text-slate-700 mb-1">
                                User Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="member-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="colleague@example.com"
                            />
                        </div>

                        {/* Role Select Dropdown */}
                        <div>
                            <label htmlFor="member-role" className="block text-sm font-medium text-slate-700 mb-1">
                                Role
                            </label>
                            <select
                                id="member-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'Admin' | 'Member')}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="mt-8 flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            Close
                        </button>
                        <button type="submit" disabled={isPending || !email.trim()} className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md shadow-indigo-600/20 ${(isPending || !email.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {isPending ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
