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


        describe('GET /api/v1/projects/:projectId/tasks', () => {
        it('should return 200 with all tasks for a project member', async () => {
            // First create two tasks
            await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Task One' });

            await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Task Two' });

            // Now fetch them
            const res = await request(app)
                .get(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].title).toBe('Task One');
            expect(res.body[1].title).toBe('Task Two');
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .get(`/api/v1/projects/${testProjectId}/tasks`);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/v1/projects/:projectId/tasks/:taskId', () => {
        it('should return 200 with a single task', async () => {
            // Create a task first
            const createRes = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Fetch Me', priority: 'High' });

            const taskId = createRes.body.id;

            // Now fetch it by ID
            const res = await request(app)
                .get(`/api/v1/projects/${testProjectId}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Fetch Me');
            expect(res.body.priority).toBe('High');
        });

        it('should return 404 if task does not exist', async () => {
            const res = await request(app)
                .get(`/api/v1/projects/${testProjectId}/tasks/999999`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });

        describe('PATCH /api/v1/projects/:projectId/tasks/:taskId', () => {
        it('should return 200 and update task on valid input', async () => {
            // 1. Create a task
            const createRes = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Old Title', priority: 'Low' });

            const taskId = createRes.body.id;

            // 2. Update it
            const updateRes = await request(app)
                .patch(`/api/v1/projects/${testProjectId}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'New Title', priority: 'High' });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.title).toBe('New Title');
            expect(updateRes.body.priority).toBe('High');
        });

        it('should return 404 if task does not exist', async () => {
            const res = await request(app)
                .patch(`/api/v1/projects/${testProjectId}/tasks/999999`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Ghost Task' });

            expect(res.status).toBe(404);
        });

        it('should return 403 if user is not a project member', async () => {
            // 1. Create a task
            const createRes = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Valid Task' });
            
            const taskId = createRes.body.id;

            // 2. Create outsider
            const outsider = await UserModel.create({
                name: 'Outsider',
                email: `outsider4${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
            const outsiderToken = jwt.sign({ userId: String(outsider.id) }, process.env.JWT_SECRET || 'testsecret');

            // 3. Try to update
            const res = await request(app)
                .patch(`/api/v1/projects/${testProjectId}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({ title: 'Hacked Title' });

            expect(res.status).toBe(403);
        });

        it('should successfully assign task to a project member', async () => {
            // 1. Create a task
            const createRes = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Task to Assign' });
            
            const taskId = createRes.body.id;

            // 2. Create a new valid member
            const memberUser = await UserModel.create({
                name: 'Valid Route Member',
                email: `route_member${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
            await ProjectMemberModel.create({ projectId: Number(testProjectId), userId: memberUser.id });

            // 3. Assign the task
            const assignRes = await request(app)
                .patch(`/api/v1/projects/${testProjectId}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ assigneeId: String(memberUser.id) });

            expect(assignRes.status).toBe(200);
            expect(assignRes.body.assigneeId).toBe(Number(memberUser.id));
        });

        it('should return 400 when assigning to a non-member', async () => {
            // 1. Create a task
            const createRes = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Task to Fail Assign' });
            
            const taskId = createRes.body.id;

            // 2. Create an outsider
            const outsiderUser = await UserModel.create({
                name: 'Outsider Route',
                email: `route_outsider${Math.random()}@test.com`,
                passwordHash: 'fake'
            });

            // 3. Try to assign the task to the outsider
            const assignRes = await request(app)
                .patch(`/api/v1/projects/${testProjectId}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ assigneeId: String(outsiderUser.id) });

            expect(assignRes.status).toBe(400);
            expect(assignRes.body.message).toBe('Cannot assign task: Target user is not a member of this project.');
        });

        it('should successfully update task status', async () => {
            // 1. Create a task
            const createRes = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Task for Status Update' });
            
            const taskId = createRes.body.id;

            // 2. Update status
            const statusRes = await request(app)
                .patch(`/api/v1/projects/${testProjectId}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'In Progress' });

            expect(statusRes.status).toBe(200);
            expect(statusRes.body.status).toBe('In Progress');
        });

        it('should return 400 for invalid status', async () => {
            // 1. Create a task
            const createRes = await request(app)
                .post(`/api/v1/projects/${testProjectId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Task for Invalid Status Update' });
            
            const taskId = createRes.body.id;

            // 2. Update status with invalid string
            const statusRes = await request(app)
                .patch(`/api/v1/projects/${testProjectId}/tasks/${taskId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'Super Done' });

            expect(statusRes.status).toBe(400);
            expect(statusRes.body.message).toBe('Invalid status. Allowed values are: Todo, In Progress, Review, Done');
        });
    });




});
