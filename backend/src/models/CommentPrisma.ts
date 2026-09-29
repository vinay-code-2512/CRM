import db from '../lib/prisma';

// Shape of a Comment row from the database
export interface CommentRow {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
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

  // Insert a new comment into the database
  async create(data: CommentCreateInput): Promise<CommentRow> {
    return await this._orm.create({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    });
  },

  // Find a single comment by its ID
  async findById(id: number): Promise<CommentRow | null> {
    return await this._orm.where({ id }).first();
  },

  // Get all comments for a specific task, oldest first
  async findByTaskId(taskId: number): Promise<CommentRow[]> {
    return await this._orm.where({ taskId }).all();
  },

  // Update the content of a comment
  async update(id: number, data: { content: string }): Promise<CommentRow> {
    return await this._orm.where({ id }).update({
      ...data,
      updatedAt: (globalThis as any).Temporal.Now.instant(),
    });
  },

  // Delete a comment by ID
  async delete(id: number): Promise<void> {
    await this._orm.where({ id }).delete();
  },
};
