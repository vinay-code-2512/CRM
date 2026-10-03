import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type Task, useTasks } from '../../tasks/api/tasks';
import { CreateTaskModal } from '../../tasks/components/CreateTaskModal';
import { TaskDetailPanel } from '../../tasks/components/TaskDetailPanel';
import { KanbanBoard } from '../../tasks/components/KanbanBoard';
import { ActivityFeed } from './ActivityFeed';

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

    // 3. State for the Create Task Modal
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

    // 4. State for the Task Detail side panel (null = closed)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // 5. Toggle between 'table', 'board', and 'activity' view
    const [viewMode, setViewMode] = useState<'table' | 'board' | 'activity'>('table');

    // 6. State for Search, Filters, and Pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [page, setPage] = useState(1);
    
    // 7. Reset page to 1 whenever a filter changes
    useEffect(() => {setPage(1)}, [searchQuery, statusFilter, priorityFilter]);

    // 2. Fetch all tasks for this project (Now with filters!)
    const { data: tasksResponse, isLoading } = useTasks(projectId!, {
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
    });

    // Helper variable to get the actual array of tasks from the response
    const tasksArray = tasksResponse?.data || [];
    
    return (
        <>
        <CreateTaskModal
            isOpen={isCreateTaskModalOpen}
            onClose={() => setIsCreateTaskModalOpen(false)}
            projectId={projectId!}
        />
        <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            projectId={projectId!}
        />
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

                <div className="flex items-center gap-3">
                    {/* View Toggle Buttons */}
                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'table' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'board' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Board
                        </button>
                        <button
                            onClick={() => setViewMode('activity')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'activity' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Activity
                        </button>
                    </div>

                    {/* Button opens the Create Task modal */}
                    <button 
                        onClick={() => setIsCreateTaskModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        + New Task
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {viewMode === 'activity' ? (
                    <ActivityFeed workspaceId={workspaceId!} projectId={projectId!} />
                ) : (
                    <>
                        {/* Search & Filter Bar */}
                        <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    {/* Search Input */}
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>

                    {/* Status Dropdown */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                    </select>

                    {/* Priority Dropdown */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                        <option value="">All Priorities</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                {/* Loading Spinner */}
                {isLoading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {/* Empty State: No tasks yet */}
                {!isLoading && tasksArray.length === 0 && (
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

                {/* Task Table — only shown in table mode */}
                {!isLoading && tasksArray.length > 0 && viewMode === 'table' && (
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
                                {tasksArray.map(task => (
                                    <tr 
                                        key={task.id} 
                                        onClick={() => setSelectedTask(task)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
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
                                                ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Kanban Board — only shown in board mode */}
                {!isLoading && tasksArray.length > 0 && viewMode === 'board' && (
                    <KanbanBoard
                        tasks={tasksArray}
                        projectId={projectId!}
                        onTaskClick={(task) => setSelectedTask(task)}
                    />
                )}

                {/* Pagination Controls */}
                {!isLoading && tasksResponse && tasksResponse.pagination.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between bg-white px-6 py-3 border border-slate-200 rounded-xl shadow-sm">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-medium text-slate-500">
                            Page {tasksResponse.pagination.page} of {tasksResponse.pagination.totalPages}
                        </span>
                        <button
                            disabled={page === tasksResponse.pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
                </>
                )}
            </main>
        </div>
        </>
    );
};
