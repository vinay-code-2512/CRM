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

describe('Comment Routes (Integration)', () => {
  let testUserId: string;
  let authToken: string;
  let testProjectId: string;
  let testTaskId: string;

  beforeAll(async () => {
    await db.connect();
  });

  beforeEach(async () => {
    // 1. Setup User and Token
    const user = await UserModel.create({
      name: 'Route User',
      email: `route-comment-${Date.now()}@test.com`,
      passwordHash: 'fake'
    });
    testUserId = String(user.id);
    authToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET || 'testsecret');

    // 2. Workspace & Project
    const ws = await WorkspaceModel.create({ name: 'WS Route' });
    const proj = await ProjectModel.create({ workspaceId: ws.id, name: 'Proj Route' });
    testProjectId = String(proj.id);

    // 3. Add Member
    await ProjectMemberModel.create({ projectId: proj.id, userId: user.id });

    // 4. Create Task
    const task = await TaskModel.create({ projectId: proj.id, title: 'Route Task' });
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
    it('should block if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/comments`)
        .send({ content: 'Unauth' });
      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Missing content

      expect(res.status).toBe(400); // Bad Request from validateBody middleware
    });

    it('should create a comment successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Integration comment' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Integration comment');
    });
  });

  describe('GET /api/v1/tasks/:taskId/comments', () => {
    it('should return comments array', async () => {
      await CommentModel.create({ taskId: Number(testTaskId), userId: Number(testUserId), content: 'Hello' });

      const res = await request(app)
        .get(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].content).toBe('Hello');
    });
  });

  describe('PATCH /api/v1/tasks/:taskId/comments/:commentId', () => {
    let createdCommentId: string;

    beforeEach(async () => {
      // Create a comment authored by the test user
      const res = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Original comment' });
      
      createdCommentId = res.body.id;
    });

    it('should return 200 and update the comment if user is the author', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${testTaskId}/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated comment' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Updated comment');
    });

    it('should return 403 if trying to edit someone elses comment', async () => {
      // 1. Create a different user
      const outsider = await UserModel.create({
        name: 'Outsider',
        email: `outsider-${Date.now()}@test.com`,
        passwordHash: 'fake'
      });
      // 2. Add them to the project so they can at least view tasks
      await ProjectMemberModel.create({ projectId: Number(testProjectId), userId: outsider.id });
      
      const outsiderToken = jwt.sign({ userId: String(outsider.id) }, process.env.JWT_SECRET || 'testsecret');

      // 3. Outsider tries to edit our comment
      const res = await request(app)
        .patch(`/api/v1/tasks/${testTaskId}/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ content: 'Hacked comment' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/tasks/:taskId/comments/:commentId', () => {
    let createdCommentId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Comment to delete' });
      
      createdCommentId = res.body.id;
    });

    it('should return 200 and delete the comment if user is the author', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${testTaskId}/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Comment deleted successfully');

      // Verify it is gone
      const getRes = await request(app)
        .get(`/api/v1/tasks/${testTaskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const commentExists = getRes.body.some((c: any) => c.id === createdCommentId);
      expect(commentExists).toBe(false);
    });

    it('should return 403 if trying to delete someone elses comment', async () => {
      const outsider = await UserModel.create({
        name: 'Outsider',
        email: `outsider-del-${Date.now()}@test.com`,
        passwordHash: 'fake'
      });
      await ProjectMemberModel.create({ projectId: Number(testProjectId), userId: outsider.id });
      const outsiderToken = jwt.sign({ userId: String(outsider.id) }, process.env.JWT_SECRET || 'testsecret');

      const res = await request(app)
        .delete(`/api/v1/tasks/${testTaskId}/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
    });
  });
});
