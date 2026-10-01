import db from '../lib/prisma'

// 1. Define the returned row shape (matches contract.prisma and PostgreSQL schema)
export interface ActivityLogRow {
    id: number;
    workspaceId: number | null;
    projectId: number | null;
    actorId: number;
    action: string;    // What they did (e.g., "TASK_CREATED", "STATUS_CHANGED")
    targetEntity: string;   // What they did it to (e.g., "Task", "Project", "Comment")
    targetId: number;   // The ID of the thing they modified (e.g., Task ID 5)

    // Optional extra data (e.g., { "oldStatus": "Todo", "newStatus": "Done" })
    metadata: Record<string, any> | null; // Reusing the pattern from UserPrisma.ts
    createdAt: Date;
}

// 2. Define the exact fields required when inserting a new log
export interface ActivityLogCreateInput {
    workspaceId?: number | null;
    projectId?: number | null;
    actorId: number;
    action: string;
    targetEntity: string;
    targetId: number;
    metadata?: Record<string, any> | null;
}

// 3. Centralized Model Object wrapping the Prisma 8 ORM
export const ActivityLogModel = {
    
    // Helper to grab the ActivityLog table from the dynamic Prisma 8 engine
    get _orm() {
        return (db.orm as any).public.ActivityLog;
    },

    // Insert a single log into the database
    async create(data: ActivityLogCreateInput): Promise<ActivityLogRow> {
        return await this._orm.create(data);
    },

    // Fetch paginated logs for a specific project
    async findByProjectPaginated(projectId: number,
        limit: number, 
        offset: number): Promise<{ data: ActivityLogRow[], total: number }> {
       
            // Create the base query scoped to the project
        const baseQuery = this._orm.where({ projectId });
       
        // Run both queries simultaneously: fetch data + fetch total count
        const [data, countResult] = await Promise.all([
         
            // Query 1: Fetch the actual rows (sorted, limited, and offset)
            baseQuery.orderBy((a: any) => a.createdAt.desc())
                .limit(limit)
                .offset(offset)
                .all(),

            // Query 2: Aggregate the total count matching the where clause
            baseQuery.aggregate((a: any) => ({
                total: a.count(),
            }))
        ]);

        return { data, total: countResult.total };
    }
};
