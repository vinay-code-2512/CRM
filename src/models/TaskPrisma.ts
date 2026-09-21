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
