import React, { useState } from 'react';
import { type Task, useUpdateTask } from '../api/tasks';

interface KanbanBoardProps {
    tasks: Task[];
    projectId: string;
    onTaskClick: (task: Task) => void; // Opens the detail panel
}

// The 4 status columns in order
const COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];

// Column header colors
const columnStyle: Record<string, string> = {
    'Todo':        'border-t-slate-400',
    'In Progress': 'border-t-blue-500',
    'Review':      'border-t-purple-500',
    'Done':        'border-t-emerald-500',
};

// Priority badge colors (same as ProjectPage)
const priorityColor = (priority: string) => {
    switch (priority) {
        case 'Urgent': return 'bg-red-100 text-red-700';
        case 'High':   return 'bg-orange-100 text-orange-700';
        case 'Medium': return 'bg-yellow-100 text-yellow-700';
        case 'Low':    return 'bg-green-100 text-green-700';
        default:       return 'bg-slate-100 text-slate-700';
    }
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, projectId, onTaskClick }) => {
    // Track which column is being hovered over during a drag
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Our update mutation to change task status on drop
    const { mutate: updateTask } = useUpdateTask(projectId);

    // Group tasks into their respective columns
    const grouped: Record<string, Task[]> = {};
    for (const col of COLUMNS) {
        grouped[col] = tasks.filter(t => t.status === col);
    }

    // --- Drag & Drop Handlers ---

    // When we start dragging a card, store the task ID
    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        e.dataTransfer.setData('taskId', String(taskId));
        e.dataTransfer.effectAllowed = 'move';
    };

    // When dragging over a column, highlight it
    const handleDragOver = (e: React.DragEvent, column: string) => {
        e.preventDefault(); // Required to allow dropping
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(column);
    };

    // When the drag leaves a column, remove the highlight
    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    // When a card is dropped on a column, update its status
    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);

        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === Number(taskId));

        // Only update if the status actually changed
        if (task && task.status !== newStatus) {
            updateTask({
                projectId,
                taskId,
                status: newStatus,
            });
        }
    };

    return (
        <div className="grid grid-cols-4 gap-4 h-full">
            {COLUMNS.map(column => (
                <div
                    key={column}
                    onDragOver={(e) => handleDragOver(e, column)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column)}
                    className={`
                        bg-slate-100 rounded-xl border-t-4 ${columnStyle[column]} p-4 flex flex-col
                        transition-colors duration-200
                        ${dragOverColumn === column ? 'bg-indigo-50 ring-2 ring-indigo-300' : ''}
                    `}
                >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{column}</h3>
                        <span className="bg-white text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                            {grouped[column].length}
                        </span>
                    </div>

                    {/* Task Cards */}
                    <div className="flex-1 space-y-3 overflow-y-auto">
                        {grouped[column].map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onClick={() => onTaskClick(task)}
                                className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm 
                                           hover:shadow-md hover:border-indigo-300 transition-all 
                                           cursor-grab active:cursor-grabbing"
                            >
                                {/* Task Title */}
                                <p className="font-medium text-slate-900 text-sm mb-2">{task.title}</p>

                                {/* Description preview */}
                                {task.description && (
                                    <p className="text-xs text-slate-400 mb-3 truncate">{task.description}</p>
                                )}

                                {/* Footer: Priority badge + Due date */}
                                <div className="flex items-center justify-between">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                    {task.dueDate && (
                                        <span className="text-xs text-slate-400">
                                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Empty column message */}
                        {grouped[column].length === 0 && (
                            <div className="text-center py-8 text-xs text-slate-400">
                                Drop tasks here
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
