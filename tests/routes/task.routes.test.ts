import request from 'supertest';
import app from '../../src/app';
import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { WorkspaceModel } from '../../src/models/WorkspacePrisma';
import { WorkspaceMemberModel } from '../../src/models/WorkspaceMemberPrisma';
import { ProjectModel } from '../../src/models/ProjectPrisma';
import { ProjectMemberModel } from '../../src/models/ProjectMemberPrisma';
import jwt from 'jsonwebtoken';

describe('Task Routes (Integration)', () => {
    let testUserId: string;
    let authToken: string;
    let testWorkspaceId: string;
    let testProjectId: string;

    beforeAll(async () => {
        await db.connect();
    });

    beforeEach(async () => {
        // 1. Setup User and Token
        const user = await UserModel.create({
            name: 'Route User',
            email: `route${Math.random()}@test.com`,
            passwordHash: 'fake'
        });
        testUserId = String(user.id);
        authToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET || 'testsecret');

        // 2. Setup Workspace (Owner)
        const workspace = await WorkspaceModel.create({ name: 'Route WS', description: '' });
        testWorkspaceId = String(workspace.id);
        await WorkspaceMemberModel.create({ workspaceId: workspace.id, userId: user.id, role: 'Owner' });

        // 3. Setup Project (Member)
        const project = await ProjectModel.create({ workspaceId: workspace.id, name: 'Route Project' });
        testProjectId = String(project.id);
        await ProjectMemberModel.create({ projectId: project.id, userId: user.id });
    });

    afterEach(async () => {
        await (db.orm as any).public.Task.deleteAll();
        await (db.orm as any).public.ProjectMember.deleteAll();
        await (db.orm as any).public.Project.deleteAll();
        await (db.orm as any).public.WorkspaceMember.deleteAll();
        await (db.orm as any).public.Workspace.deleteAll();
        await (db.orm as any).public.User.deleteAll();
    });

    describe('POST /api/v1/projects/:projectId/tasks', () => {
        it('should return 201 and create task on valid input', async () => {
            const res = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'New API Task',
                    priority: 'Urgent',
                    labels: ['backend']
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.title).toBe('New API Task');
            expect(res.body.priority).toBe('Urgent');
            expect(res.body.status).toBe('Todo');
            expect(res.body.labels).toEqual(['backend']);
        });

        it('should return 400 if title is missing', async () => {
            const res = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ priority: 'High' }); // Missing title

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('Missing required fields');
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .send({ title: 'Auth check' });

            expect(res.status).toBe(401);
        });

        it('should return 403 if user is not a project member', async () => {
            // Create a brand new user who is NOT in the project (or workspace)
            const outsider = await UserModel.create({
                name: 'Outsider',
                email: `outsider${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
            const outsiderToken = jwt.sign({ userId: String(outsider.id) }, process.env.JWT_SECRET || 'testsecret');

            const res = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({ title: 'Sneaky Task' });

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Access denied. You must be a project member to create tasks.');
        });
    });
});
