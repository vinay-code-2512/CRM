import db from '../lib/prisma';
import { UserModel } from './UserPrisma';

// Shape of a Comment row from the database
export interface CommentRow {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}


// Fields needed when creating a new comment
export interface CommentCreateInput {
  taskId: number;
  userId: number;
  content: string;
}

export const CommentModel = {
  // Access the Comment table through Prisma ORM
  get _orm() {
    return (db.orm as any).public.Comment;
  },

  // Helper to fetch and attach user info to a raw comment row
  async _attachUser(comment: any): Promise<CommentRow> {
    const user = await UserModel.findById(comment.userId);
    return {
      ...comment,
      user: user ? { id: user.id, name: user.name, email: user.email } : null
    };
  },

  // Insert a new comment into the database
  async create(data: CommentCreateInput): Promise<CommentRow> {
    const comment = await this._orm.create({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    });
    return await this._attachUser(comment);
  },

  // Find a single comment by its ID
  async findById(id: number): Promise<CommentRow | null> {
    return await this._orm.where({ id }).first();
  },

  // Get all comments for a specific task, oldest first
  async findByTaskId(taskId: number): Promise<CommentRow[]> {
    const comments = await this._orm.where({ taskId }).all();
    return await Promise.all(comments.map((c: any) => this._attachUser(c)));
  },

  // Update the content of a comment
  async update(id: number, data: { content: string }): Promise<CommentRow> {
    const comment = await this._orm.where({ id }).update({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    });
    return await this._attachUser(comment);
  },

  // Delete a comment by ID
  async delete(id: number): Promise<void> {
    await this._orm.where({ id }).delete();
  },
};
