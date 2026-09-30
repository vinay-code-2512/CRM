import db from '../lib/prisma';

export interface TaskRow {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    labels: any | null;
    dueDate: Date | null;
    assigneeId: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskCreateInput {
    projectId: number;
    title: string;
    description?: string | null;
    status?: string;
    priority?: string;
    labels?: any | null;
    dueDate?: Date | null;
    assigneeId?: number | null;
}

export const TaskModel = {
    get _orm() {
        return (db.orm as any).public.Task;
    },

    async create(data: TaskCreateInput): Promise<TaskRow> {
        return await this._orm.create({
            ...data,
            updatedAt: (globalThis as any).Temporal.Now.instant(),
        });
    },


    async findById(id: number): Promise<TaskRow | null> {
        return await this._orm.where({ id }).first();
    },


    async findByProjectId(projectId: number): Promise<TaskRow[]> {
        return await this._orm.where({ projectId }).all();
    },

    // HELPER: Builds the filtered query chain so both data + count use the same WHERE clauses
    _applyFilters(
        projectId: number,
        filters: { status?: string; priority?: string; assigneeId?: number; search?: string }
    ) {
        // Start with the base query scoped to this project
        let query = this._orm.where({ projectId });

        // Apply exact-match filters only when they are provided
        if (filters.status) {
            query = query.where({ status: filters.status });
        }
        if (filters.priority) {
            query = query.where({ priority: filters.priority });
        }
        if (filters.assigneeId) {
            query = query.where({ assigneeId: filters.assigneeId });
        }

        // Apply case-insensitive partial match on title
        if (filters.search) {
            query = query.where((t: any) => t.title.ilike(`%${filters.search}%`));
        }

        return query;
    },

    // Fetch a page of tasks matching the filters, sorted newest-first
    async searchAndFilter(
        projectId: number,
        filters: { status?: string; priority?: string; assigneeId?: number; search?: string },
        pagination: { limit: number; offset: number }
    ): Promise<TaskRow[]> {
        const query = this._applyFilters(projectId, filters);

        // Apply sorting + pagination on top of the shared filter chain
        const data = await query
            .orderBy((t: any) => t.createdAt.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
            .all();

        return data;
    },

    // Count total matching tasks using SQL COUNT(*) — no rows loaded into memory
    async countFiltered(
        projectId: number,
        filters: { status?: string; priority?: string; assigneeId?: number; search?: string }
    ): Promise<number> {
        const query = this._applyFilters(projectId, filters);

        // Prisma 8 ORM .aggregate() translates to SELECT COUNT(*) in SQL
        // aggregate() means perform a calculation on a set of database records
        // instead of returning the records themselves.
        // a.count - Count how many records match this query.
        const result = await query.aggregate((a: any) => ({
            total: a.count(),
        }));

        return result.total;
    },



    async update(id: number, data: Partial<TaskCreateInput>): Promise<TaskRow> {
        return await this._orm.where({ id }).update({
            ...data,
            updatedAt: (globalThis as any).Temporal.Now.instant(),
        });
    },

    // ==========================================
    // DELETE TASK
    // ==========================================
    // This function takes an ID and deletes that specific task row from the database
    async delete(id: number): Promise<void> {
        await this._orm.where({ id }).delete();
    },



};
