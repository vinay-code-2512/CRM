import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWorkspace, useDeleteWorkspace } from '../api/workspaces';
import { useProjects, useDeleteProject } from '../../projects/api/projects';
import { CreateProjectModal } from '../../projects/components/CreateProjectModal';
import { AddMemberModal } from './AddMemberModal';


export const WorkspacePage: React.FC = () => {
    // 1. Get the workspaceId from the URL (e.g., /workspaces/1)
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();

    // 2. Fetch the single workspace data
    const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceId!);

    // 3. Fetch the projects belonging to this workspace
    const { data: projects, isLoading: isProjectsLoading } = useProjects(workspaceId!);

    // 4. State for the Create Project Modal
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    // 5. State for the Add Member Modal
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    // 6. Project deletion mutation
    const { mutate: deleteProjectMutation } = useDeleteProject(workspaceId!);

    const handleDeleteProject = (e: React.MouseEvent, projectId: number, projectName: string) => {
        e.stopPropagation(); // Prevent card navigation click
        if (!window.confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
            return;
        }

        deleteProjectMutation(
            { workspaceId: workspaceId!, projectId: String(projectId) },
            {
                onError: (err: any) => {
                    const message = err.response?.data?.message || 'Failed to delete project. Only Workspace Owners and Admins can delete projects.';
                    alert(message);
                }
            }
        );
    };

    // 7. Workspace deletion mutation
    const { mutate: deleteWorkspaceMutation, isPending: isDeletingWorkspace } = useDeleteWorkspace();

    const handleDeleteWorkspace = () => {
        if (!workspace) return;
        if (!window.confirm(`Are you sure you want to delete workspace "${workspace.name}"? This action cannot be undone.`)) {
            return;
        }

        deleteWorkspaceMutation(workspaceId!, {
            onSuccess: () => {
                navigate('/');
            },
            onError: (err: any) => {
                const message = err.response?.data?.message || 'Failed to delete workspace. Only the Workspace Owner can delete it.';
                alert(message);
            }
        });
    };

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

                    {/* Delete Workspace button */}
                    <button 
                        onClick={handleDeleteWorkspace}
                        disabled={isDeletingWorkspace}
                        className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Workspace (Owner only)"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {isDeletingWorkspace ? 'Deleting...' : 'Delete Workspace'}
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
                            <div 
                                key={project.id} 
                                onClick={() => navigate(`/workspaces/${workspaceId}/projects/${project.id}`)}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer hover:border-indigo-300 relative group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete project"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-slate-500 text-sm mb-4">{project.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
        </>
    );
};
