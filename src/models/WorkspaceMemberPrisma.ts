import db from '../lib/prisma';

export interface WorkspaceMemberRow {
  id: number;
  workspaceId: number;
  userId: number;
  role: 'Owner' | 'Admin' | 'Member';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberCreateInput {
  workspaceId: number;
  userId: number;
  role: 'Owner' | 'Admin' | 'Member';
}
 
export const WorkspaceMemberModel = {
  get _orm() {
    return (db.orm as any).public.WorkspaceMember;
  },

  async create(data: WorkspaceMemberCreateInput): Promise<WorkspaceMemberRow> {
    return await this._orm.create({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    });
  },

  async findByUserId(userId: number): Promise<WorkspaceMemberRow[]> {
    return await this._orm.where({ userId }).all();
  },

  async findByWorkspaceAndUser(workspaceId: number, userId: number): Promise<WorkspaceMemberRow | null> {
    return await this._orm.where({ workspaceId, userId }).first();
  },

  async delete(workspaceId: number , userId:number): Promise<void>{
    await this._orm.where({workspaceId,userId}).delete()
  },


};
