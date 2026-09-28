import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTasks } from '../../tasks/api/tasks';

// Helper: maps priority to a colored badge
const priorityColor = (priority: string) => {
    switch (priority) {
        case 'Urgent': return 'bg-red-100 text-red-700';
        case 'High':   return 'bg-orange-100 text-orange-700';
        case 'Medium': return 'bg-yellow-100 text-yellow-700';
        case 'Low':    return 'bg-green-100 text-green-700';
        default:       return 'bg-slate-100 text-slate-700';
    }
};

// Helper: maps status to a colored badge
const statusColor = (status: string) => {
    switch (status) {
        case 'Done':        return 'bg-emerald-100 text-emerald-700';
        case 'In Progress': return 'bg-blue-100 text-blue-700';
        case 'Review':      return 'bg-purple-100 text-purple-700';
        case 'Todo':        return 'bg-slate-100 text-slate-600';
        default:            return 'bg-slate-100 text-slate-600';
    }
};

export const ProjectPage: React.FC = () => {
    // 1. Grab the IDs from the URL
    const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();

    // 2. Fetch all tasks for this project
    const { data: tasks, isLoading } = useTasks(projectId!);

    return (
        <div className="flex h-screen bg-slate-50 font-sans flex-col">

            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
                <div className="flex items-center space-x-4">
                    {/* Link back to the workspace page */}
                    <Link
                        to={`/workspaces/${workspaceId}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                        &larr; Back to Workspace
                    </Link>
                    <h1 className="text-xl font-bold text-slate-800">Project Tasks</h1>
                </div>

                {/* We will wire this button in FE-3.2 */}
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    + New Task
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {/* Empty State: No tasks yet */}
                {!isLoading && tasks && tasks.length === 0 && (
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No tasks yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Click "+ New Task" to create your first task for this project.
                        </p>
                    </div>
                )}

                {/* Task Table */}
                {!isLoading && tasks && tasks.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                                        {/* Task Title */}
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900">{task.title}</span>
                                            {task.description && (
                                                <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{task.description}</p>
                                            )}
                                        </td>

                                        {/* Status Badge */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(task.status)}`}>
                                                {task.status}
                                            </span>
                                        </td>

                                        {/* Priority Badge */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${priorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </td>

                                        {/* Due Date */}
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {task.dueDate
                                                ? new Date(task.dueDate).toLocaleDateString()
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};
