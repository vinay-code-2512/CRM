// Import the database/ORM connection
import db from '../lib/prisma';

// Defines the shape of a WorkspaceMember record returned from the database
export interface WorkspaceMemberRow {
  id: number;
  workspaceId: number;
  userId: number;
  role: 'Owner' | 'Admin' | 'Member';
  createdAt: Date;
  updatedAt: Date;
}

// Defines the data required when creating a WorkspaceMember
export interface WorkspaceMemberCreateInput {
  workspaceId: number;
  userId: number;
  role: 'Owner' | 'Admin' | 'Member';
}

// Model containing all database operations for WorkspaceMember
export const WorkspaceMemberModel = {
 
// Get the WorkspaceMember table from the ORM  
  get _orm() {
    return (db.orm as any).public.WorkspaceMember;
  },

   // Create a new workspace membership
  async create(data: WorkspaceMemberCreateInput): Promise<WorkspaceMemberRow> {
    return await this._orm.create({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant()
    });
  },

  // Find all workspace memberships for a particular user
  async findByUserId(userId: number): Promise<WorkspaceMemberRow[]> {
    return await this._orm.where({ userId }).all();
  },

  async findByWorkspaceAndUser(workspaceId: number, userId: number): Promise<WorkspaceMemberRow | null> {
    return await this._orm.where({ workspaceId, userId }).first();
  },

  async delete(workspaceId: number, userId: number): Promise<void> {
    await this._orm.where({ workspaceId, userId }).delete()
  },

  async deleteByWorkspaceId(workspaceId: number): Promise<void> {
    await this._orm.where({ workspaceId }).delete();
  },

  async updateRole(workspaceId: number, userId: number, role: 'Owner' | 'Admin' | 'Member'): Promise<WorkspaceMemberRow | null> {
    const record = await this._orm.where({ workspaceId, userId }).first();
    if (!record)
      return null;

    await this._orm.where({ id: record.id }).update({
      role,
      updatedAt: (globalThis as any).Temporal.Now.instant()
    });

    // Fetch and return the freshly updated record
    return await this._orm.where({ id: record.id }).first();
  },


};
