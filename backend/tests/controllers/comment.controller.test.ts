import request from 'supertest';
import app from '../../src/app';
import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { WorkspaceModel } from '../../src/models/WorkspacePrisma';
import { ProjectModel } from '../../src/models/ProjectPrisma';
import { ProjectMemberModel } from '../../src/models/ProjectMemberPrisma';
import { TaskModel } from '../../src/models/TaskPrisma';
import { CommentModel } from '../../src/models/CommentPrisma';
import jwt from 'jsonwebtoken';

describe('Comment Controller', () => {
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let testTaskId: string;
  let otherAuthToken: string;

  beforeAll(async () => {
    await db.connect();
  });

  beforeEach(async () => {
    // 1. User
    const user = await UserModel.create({ name: 'User 1', email: `test1-${Date.now()}@test.com`, passwordHash: 'hash' });
    testUserId = String(user.id);
    authToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET || 'testsecret');

    const user2 = await UserModel.create({ name: 'User 2', email: `test2-${Date.now()}@test.com`, passwordHash: 'hash' });
    otherAuthToken = jwt.sign({ userId: String(user2.id) }, process.env.JWT_SECRET || 'testsecret');

    // 2. Workspace & Project
    const ws = await WorkspaceModel.create({ name: 'WS 1' });
    const proj = await ProjectModel.create({ workspaceId: ws.id, name: 'Proj 1' });
    testProjectId = String(proj.id);

    // 3. Member
    await ProjectMemberModel.create({ projectId: proj.id, userId: user.id });

    // 4. Task
    const task = await TaskModel.create({ projectId: proj.id, title: 'Test Task' });
    testTaskId = String(task.id);
  });

  afterEach(async () => {
    await (db.orm as any).public.Comment.deleteAll();
    await (db.orm as any).public.Task.deleteAll();
    await (db.orm as any).public.ProjectMember.deleteAll();
    await (db.orm as any).public.Project.deleteAll();
    await (db.orm as any).public.Workspace.deleteAll();
    await (db.orm as any).public.User.deleteAll();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/tasks/:taskId/comments', () => {
    it('should create a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'My first comment' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.content).toBe('My first comment');
    });

    it('should deny if user is not in the project', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ content: 'Unauthorized comment' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/tasks/:taskId/comments', () => {
    it('should get comments for a task', async () => {
      await CommentModel.create({ taskId: Number(testTaskId), userId: Number(testUserId), content: 'Test' });

      const res = await request(app)
        .get(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe('PATCH /api/v1/tasks/:taskId/comments/:commentId', () => {
    it('should edit own comment', async () => {
      const comment = await CommentModel.create({ taskId: Number(testTaskId), userId: Number(testUserId), content: 'Old' });

      const res = await request(app)
        .patch(`/api/v1/tasks/${testTaskId}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'New' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('New');
    });
  });

  describe('DELETE /api/v1/tasks/:taskId/comments/:commentId', () => {
    it('should delete own comment', async () => {
      const comment = await CommentModel.create({ taskId: Number(testTaskId), userId: Number(testUserId), content: 'To delete' });

      const res = await request(app)
        .delete(`/api/v1/tasks/${testTaskId}/comments/${comment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });
});
