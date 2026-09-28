import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../api/workspaces';
import { useProjects } from '../../projects/api/projects';
import { CreateProjectModal } from '../../projects/components/CreateProjectModal';
import { AddMemberModal } from './AddMemberModal';


export const WorkspacePage: React.FC = () => {
    // 1. Get the workspaceId from the URL (e.g., /workspaces/1)
    const { workspaceId } = useParams<{ workspaceId: string }>();

    // 2. Fetch the single workspace data
    const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceId!);

    // 3. Fetch the projects belonging to this workspace
    const { data: projects, isLoading: isProjectsLoading } = useProjects(workspaceId!);

    // 4. State for the Create Project Modal
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    // 5. State for the Add Member Modal
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    if (isWorkspaceLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!workspace) {
        return <div className="p-8 text-red-500">Workspace not found.</div>;
    }

    return (
        <>
        <CreateProjectModal 
            isOpen={isCreateProjectModalOpen} 
            onClose={() => setIsCreateProjectModalOpen(false)} 
            workspaceId={workspaceId!} 
        />
        <AddMemberModal 
            isOpen={isAddMemberModalOpen} 
            onClose={() => setIsAddMemberModalOpen(false)} 
            workspaceId={workspaceId!} 
        />
        <div className="flex h-screen bg-slate-50 font-sans flex-col">
            
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                        &larr; Back to Dashboard
                    </Link>
                    <h1 className="text-xl font-bold text-slate-800">{workspace.name}</h1>
                </div>
                
                <div className="flex gap-3">
                    {/* Button opens the member modal */}
                    <button 
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Add Member
                    </button>

                    {/* Button opens the project modal */}
                    <button 
                        onClick={() => setIsCreateProjectModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        + New Project
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <p className="text-slate-500 mb-8 max-w-2xl">
                    {workspace.description || 'No description provided.'}
                </p>

                <h2 className="text-2xl font-bold text-slate-800 mb-6">Projects</h2>

                {isProjectsLoading && (
                    <div className="text-slate-500 animate-pulse">Loading projects...</div>
                )}

                {/* Empty State for Projects */}
                {!isProjectsLoading && projects && projects.length === 0 && (
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No projects yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Get started by creating a project to organize tasks for your team.
                        </p>
                    </div>
                )}

                {/* Grid for Projects */}
                {!isProjectsLoading && projects && projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer hover:border-indigo-300">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{project.name}</h3>
                                <p className="text-slate-500 text-sm mb-4">{project.description || 'No description provided.'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
        </>
    );
};
