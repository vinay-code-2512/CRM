import React, { useState } from 'react';
import { useProjectActivity, type ActivityLog } from '../api/activity';

interface ActivityFeedProps {
    workspaceId: string;
    projectId: string;
}

// Helper to format the raw action string into a human-readable sentence
const formatAction = (log: ActivityLog): string => {
    // Attempt to pull the relevant name/title from the metadata blob
    const title = log.metadata?.title || log.metadata?.email || `#${log.targetId}`;

    switch (log.action) {
        case 'PROJECT_CREATED': return 'created this project.';
        case 'PROJECT_MEMBER_ADDED': return `added member ${title} to the project.`;
        case 'TASK_CREATED': return `created task "${title}".`;
        case 'TASK_UPDATED': return `updated task "${title}".`;
        case 'TASK_DELETED': return `deleted a task.`;
        case 'COMMENT_CREATED': return `commented on a task.`;
        case 'COMMENT_UPDATED': return `edited a comment.`;
        case 'COMMENT_DELETED': return `deleted a comment.`;
        default: return `performed an action (${log.action}).`;
    }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ workspaceId, projectId }) => {
    // 1. Local state to track which page of activity we are viewing
    const [page, setPage] = useState(1);
    const limit = 20;

    // 2. Fetch the activity data using our new React Query hook
    const { data: response, isLoading, isError } = useProjectActivity(workspaceId, projectId, page, limit);

    // 3. Handle loading state
    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex justify-center items-center">
                <div className="text-slate-500 animate-pulse">Loading activity feed...</div>
            </div>
        );
    }

    // 4. Handle error state
    if (isError) {
        return (
            <div className="flex-1 p-8 flex justify-center items-center">
                <div className="text-red-500">Failed to load activity. Please try again.</div>
            </div>
        );
    }

    const logs = response?.data || [];
    const pagination = response?.pagination;

    // 5. Handle empty state
    if (logs.length === 0) {
        return (
            <div className="flex-1 p-8 flex justify-center items-center">
                <div className="text-slate-500 italic">No activity recorded yet.</div>
            </div>
        );
    }

    // 6. Render the timeline feed
    return (
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">Project Activity</h2>

                <div className="space-y-4">
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                            {/* Simple Avatar Placeholder */}
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 font-bold text-xs">ID {log.actorId}</span>
                            </div>

                            <div>
                                <p className="text-sm text-slate-700">
                                    <span className="font-semibold text-slate-900">User {log.actorId}</span> {formatAction(log)}
                                </p>
                                <span className="text-xs text-slate-400">
                                    {new Date(log.createdAt).toLocaleString('en-US', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 7. Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${page === 1
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500 self-center">
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${page >= pagination.totalPages
                                    ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
