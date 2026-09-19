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

    describe('PATCH /api/v1/workspaces/:id/projects/:projectId', () => {
        let createdProjectId: string;

        beforeEach(async () => {
            // Setup: Create a project first to update
            const createRes = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Old Name' });
            createdProjectId = createRes.body.id;
        });

        it('should return 200 and update project if authorized', async () => {
            const res = await request(app)
                .patch(`/api/v1/workspaces/${testWorkspaceId}/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'New Name', isArchived: true });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('New Name');
            expect(res.body.isArchived).toBe(true);
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .patch(`/api/v1/workspaces/${testWorkspaceId}/projects/${createdProjectId}`)
                .send({ name: 'Hacked Name' });

            expect(res.status).toBe(401);
        });
    });


    describe('POST /api/v1/workspaces/:id/projects/:projectId/members', () => {
        let createdProjectId: string;
        let targetUserId: string;
        let targetAuthToken: string;

        beforeEach(async () => {
            // Create a project
            const createRes = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Member Test Project' });
            createdProjectId = createRes.body.id;

            // Create a second user and add them to the workspace
            const targetUser = await UserModel.create({
                name: 'Target Route User',
                email: `target-route${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
            targetUserId = String(targetUser.id);

            await WorkspaceMemberModel.create({
                workspaceId: Number(testWorkspaceId),
                userId: targetUser.id,
                role: 'Member'
            });
        });

        it('should return 201 and add a member to the project', async () => {
            const res = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects/${createdProjectId}/members`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ userId: targetUserId });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('User added to project');
            expect(res.body.member.userId).toBe(Number(targetUserId));
        });

        it('should return 400 if userId is missing', async () => {
            const res = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects/${createdProjectId}/members`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            //  400 Bad Request - Missing required fields or business logic error
            expect(res.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects/${createdProjectId}/members`)
                .send({ userId: targetUserId });

            //  401 Unauthorised- No token or invalid token (not logged in)
            expect(res.status).toBe(401);
        });
    });


    describe('DELETE /api/v1/workspaces/:id/projects/:projectId', () => {
        let createdProjectId: string;

        beforeEach(async () => {
            // Create a project first to delete
            const createRes = await request(app)
                .post(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Project to Delete' });
            createdProjectId = createRes.body.id;
        });

        it('should return 200 and delete project if authorized', async () => {
            const res = await request(app)
                .delete(`/api/v1/workspaces/${testWorkspaceId}/projects/${createdProjectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Project deleted successfully');

            // Verify it's actually gone from the GET list
            const getRes = await request(app)
                .get(`/api/v1/workspaces/${testWorkspaceId}/projects`)
                .set('Authorization', `Bearer ${authToken}`);

            // Should not find the deleted project in the list
            const projectExists = getRes.body.some((p: any) => p.id === createdProjectId);
            expect(projectExists).toBe(false);
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .delete(`/api/v1/workspaces/${testWorkspaceId}/projects/${createdProjectId}`);

            expect(res.status).toBe(401);
        });
    });

});
