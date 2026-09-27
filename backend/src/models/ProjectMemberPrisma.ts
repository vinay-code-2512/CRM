import db from '../lib/prisma';

export interface ProjectMemberRow {
  id: number;
  projectId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMemberCreateInput {
  projectId: number;
  userId: number;
}

export const ProjectMemberModel = {
  get _orm() {
    return (db.orm as any).public.ProjectMember;
  },

  async create(data: ProjectMemberCreateInput): Promise<ProjectMemberRow> {
    return await this._orm.create({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    });
  },

  async findByProjectAndUser(projectId: number, userId: number): Promise<ProjectMemberRow | null> {
    return await this._orm.where({ projectId, userId }).first();
  },

  async findByProjectId(projectId: number): Promise<ProjectMemberRow[]> {
    return await this._orm.where({ projectId }).all();
  },

  async findByUserId(userId: number): Promise<ProjectMemberRow[]> {
    return await this._orm.where({ userId }).all();
  },

  async delete(projectId: number, userId: number): Promise<void> {
    await this._orm.where({ projectId, userId }).delete();
  },

  async deleteByProjectId(projectId: number): Promise<void> {
    await this._orm.where({ projectId }).delete();
  },
};
