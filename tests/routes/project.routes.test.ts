import request from 'supertest';
import app from '../../src/app';
import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { WorkspaceModel } from '../../src/models/WorkspacePrisma';
import { WorkspaceMemberModel } from '../../src/models/WorkspaceMemberPrisma';
import jwt from 'jsonwebtoken';

describe('Project Routes (Integration)', () => {
    let testUserId: string;
    let testWorkspaceId: string;
    let authToken: string;

    beforeAll(async () => {
        await db.connect();
    });

    beforeEach(async () => {
        // Create user
        const user = await UserModel.create({
            name: 'Route Test User',
            email: `route${Math.random()}@test.com`,
            passwordHash: 'fake'
        });
        testUserId = String(user.id);
        authToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET || 'testsecret');

        // Create workspace and make user Owner
        const workspace = await WorkspaceModel.create({ name: 'Route WS', description: '' });
        testWorkspaceId = String(workspace.id);
        await WorkspaceMemberModel.create({
            workspaceId: workspace.id,
            userId: user.id,
            role: 'Owner'
        });
    });

    afterEach(async () => {
        await (db.orm as any).public.ProjectMember.deleteAll();
        await (db.orm as any).public.Project.deleteAll();
        await (db.orm as any).public.WorkspaceMember.deleteAll();
        await (db.orm as any).public.Workspace.deleteAll();
        await (db.orm as any).public.User.deleteAll();
    });

    describe('POST /api/v1/workspaces/:id/projects', () => {
        it('should return 201 and create a project', async () => {
            const res = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Integration Project', description: 'Works' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('Integration Project');
        });

        it('should return 400 if name is missing (Validation)', async () => {
            const res = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ description: 'No Name' });

            expect(res.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .send({ name: 'Hacker Project' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/v1/workspaces/:id/projects', () => {
        it('should return 200 and list projects', async () => {
            await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Test Project 1' });

            const res = await request(app)
                .get(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('Test Project 1');
        });
    });
});
