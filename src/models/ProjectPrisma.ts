import db from '../lib/prisma';

export interface ProjectRow {
    id: number;
    workspaceId: number;
    name: string;
    description: string | null;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectCreateInput {
    workspaceId: number;
    name: string;
    description?: string | null;
}

export const ProjectModel = {
    get _orm() {
        return (db.orm as any).public.Project;
    },

    async create(data: ProjectCreateInput): Promise<ProjectRow> {
        return await this._orm.create({
            ...data,
            updatedAt: (globalThis as any).Temporal.Now.instant(),
        });
    },

    async findById(id: number): Promise<ProjectRow | null> {
        return await this._orm.where({ id }).first();
    },

    async findByWorkspaceId(workspaceId: number): Promise<ProjectRow[]> {
        return await this._orm.where({ workspaceId, isArchived: false }).all();
    },

    async update(id: number, data: Partial<{ name: string; description: string | null; isArchived: boolean }>): Promise<ProjectRow | null> {
        await this._orm.where({ id }).update({
            ...data,
            updatedAt: (globalThis as any).Temporal.Now.instant(),
        });
        return await this._orm.where({ id }).first();
    },

    async delete(id: number): Promise<void> {
        await this._orm.where({ id }).delete();
    },
};
