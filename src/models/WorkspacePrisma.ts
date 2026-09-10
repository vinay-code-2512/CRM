import db from '../lib/prisma';

export interface WorkspaceRow {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceCreateInput {
  name: string;
  description?: string | null;
}

export const WorkspaceModel = {
  get _orm() {
    return (db.orm as any).public.Workspace;
  },

  async create(data: WorkspaceCreateInput): Promise<WorkspaceRow> {
    return await this._orm.create({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    });
  },

  async findById(id: number): Promise<WorkspaceRow | null> {
    return await this._orm.where({ id }).first();
  },

  async findByIds(ids: number[]): Promise<WorkspaceRow[]> {
    if (ids.length === 0) return [];
    const results: WorkspaceRow[] = [];
    for (const id of ids) {
      const workspace = await this._orm.where({ id }).first();
      if (workspace) results.push(workspace);
    }
    return results;
  },
};
 