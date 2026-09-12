import request from 'supertest';
import db from '../../src/lib/prisma';
import app from '../../src/app';
import { UserModel } from '../../src/models/UserPrisma';

describe('Workspace API Routes', () => {
    let validToken: string;

    beforeAll(async () => {
        await db.connect();
    });

    

    // Before each test: register + login a fresh user to get a valid JWT
    beforeEach(async () => {
        const testEmail = `workspace${Math.random()}@test.com`;

        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Workspace Tester',
                email: testEmail,
                password: 'password123'
            });

        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: 'password123'
            });

        validToken = loginRes.body.token;
    });

    // After each test: wipe workspace-related tables AND users
    afterEach(async () => {
        await (db.orm as any).public.WorkspaceMember.deleteAll();
        await (db.orm as any).public.Workspace.deleteAll();
        await (db.orm as any).public.User.deleteAll();
    });

    // ==========================================
    // 1. CREATE WORKSPACE - HAPPY PATH
    // ==========================================
    it('should create a workspace successfully and return 201', async () => {
        const response = await request(app)
            .post('/api/v1/workspaces')
            .set('Authorization', `Bearer ${validToken}`)
            .send({
                name: 'Test Workspace',
                description: 'A workspace for testing'
            });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Test Workspace');
        expect(response.body.description).toBe('A workspace for testing');
        expect(response.body.id).toBeDefined();
    });

    // ==========================================
    // 2. CREATE WORKSPACE - VERIFY OWNER MEMBERSHIP
    // ==========================================
    it('should automatically add the creator as Owner', async () => {
        const createRes = await request(app)
            .post('/api/v1/workspaces')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'Owner Test Workspace' });

        expect(createRes.status).toBe(201);

        // DATABASE CHECK: Verify the membership record was created
        const membership = await (db.orm as any).public.WorkspaceMember
            .where({ workspaceId: createRes.body.id })
            .first();

        expect(membership).not.toBeNull();
        expect(membership.role).toBe('Owner');
    });

    // ==========================================
    // 3. CREATE WORKSPACE - UNAUTHENTICATED REQUEST
    // ==========================================
    it('should return 401 if no token is provided', async () => {
        const response = await request(app)
            .post('/api/v1/workspaces')
            .send({ name: 'Should Fail Workspace' });

        expect(response.status).toBe(401);
    });

    // ==========================================
    // 4. CREATE WORKSPACE - MISSING NAME
    // ==========================================
    it('should return 400 if workspace name is missing', async () => {
        const response = await request(app)
            .post('/api/v1/workspaces')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ description: 'No name provided' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('ValidationError');
        expect(response.body.message.toLowerCase()).toContain('name');
    });

    // ==========================================
    // 5. CREATE WORKSPACE - OPTIONAL DESCRIPTION
    // ==========================================
    it('should create a workspace without a description', async () => {
        const response = await request(app)
            .post('/api/v1/workspaces')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ name: 'No Description Workspace' });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('No Description Workspace');
    });

    // ==========================================
    // 6. CREATE WORKSPACE - INVALID TOKEN
    // ==========================================
    it('should return 401 if token is invalid', async () => {
        const response = await request(app)
            .post('/api/v1/workspaces')
            .set('Authorization', 'Bearer fake-garbage-token')
            .send({ name: 'Should Fail Workspace' });

        expect(response.status).toBe(401);
    });

    // ==========================================
    // GET /workspaces - LIST WORKSPACES
    // ==========================================
    describe('GET /api/v1/workspaces', () => {

        it('should return 200 and a list of workspaces the user belongs to', async () => {
            // 1. First, the user creates a workspace so they have at least one!
            await request(app)
                .post('/api/v1/workspaces')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'My First Workspace' });

            // 2. Then they fetch their workspaces
            const response = await request(app)
                .get('/api/v1/workspaces')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            
            // We expect an array containing our created workspace
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].name).toBe('My First Workspace');
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/workspaces');

            expect(response.status).toBe(401);
        });
    });



        // ==========================================
    // 3. POST /api/v1/workspaces/:id/members
    // ==========================================
    describe('POST /api/v1/workspaces/:id/members', () => {
        let workspaceId: number;
        let targetUser: any;

        beforeEach(async () => {
            // HOW: We need an actual workspace in the DB to test adding members
            const createRes = await request(app)
                .post('/api/v1/workspaces')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Route Test Workspace', description: '' });
            
            workspaceId = createRes.body.id;

            // HOW: Create a target user to add
            targetUser = await UserModel.create({
                name: 'Route Target',
                email: `routetarget${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
        });

        // TEST 1: Happy Path
        it('should return 201 and membership data on successful member addition', async () => {
            const response = await request(app)
                .post(`/api/v1/workspaces/${workspaceId}/members`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ email: targetUser.email, role: 'Member' });

            expect(response.status).toBe(201);
            expect(response.body.userId).toBe(targetUser.id);
            expect(response.body.role).toBe('Member');
        });

        // TEST 2: Validation Check
        it('should return 400 if email or role are missing from the body', async () => {
            const response = await request(app)
                .post(`/api/v1/workspaces/${workspaceId}/members`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ email: targetUser.email }); // missing role

            // SECURITY CHECK: validateBody middleware should intercept this
            expect(response.status).toBe(400);
        });

        // TEST 3: Auth Check
        it('should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .post(`/api/v1/workspaces/${workspaceId}/members`)
                .send({ email: targetUser.email, role: 'Member' });

            // SECURITY CHECK: requireAuth middleware should intercept this
            expect(response.status).toBe(401);
        });
    });


    // ==========================================
    // 4. DELETE /api/v1/workspaces/:workspaceId/members/:userId
    // ==========================================
    describe('DELETE /api/v1/workspaces/:workspaceId/members/:userId', () => {
        let workspaceId: number;
        let targetUser: any;

        beforeEach(async () => {
            // HOW: Create an actual workspace in the DB
            const createRes = await request(app)
                .post('/api/v1/workspaces')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Route Remove Workspace', description: '' });
            
            workspaceId = createRes.body.id;

            // HOW: Create a target user
            targetUser = await UserModel.create({
                name: 'Route Target RM',
                email: `routerms${Math.random()}@test.com`,
                passwordHash: 'fake'
            });

            // HOW: Add the target user to the workspace so we can test removing them
            await request(app)
                .post(`/api/v1/workspaces/${workspaceId}/members`)
                .set('Authorization', `Bearer ${validToken}`)
                .send({ email: targetUser.email, role: 'Member' });
        });

        // TEST 1: Happy Path
        it('should return 200 and success message on successful member removal', async () => {
            const response = await request(app)
                .delete(`/api/v1/workspaces/${workspaceId}/members/${targetUser.id}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Member removed successfully');
        });

        // TEST 2: Auth Check
        it('should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .delete(`/api/v1/workspaces/${workspaceId}/members/${targetUser.id}`);

            // SECURITY CHECK: requireAuth middleware should intercept this
            expect(response.status).toBe(401);
        });
    });

        // ==========================================
    // 5. DELETE /api/v1/workspaces/:id
    // ==========================================
    describe('DELETE /api/v1/workspaces/:id', () => {
        let workspaceId: number;

        beforeEach(async () => {
            // HOW: Create an actual workspace in the DB so we can delete it
            const createRes = await request(app)
                .post('/api/v1/workspaces')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Route Delete Workspace', description: '' });
            
            workspaceId = createRes.body.id;
        });

        // TEST 1: Happy Path
        it('should return 200 and success message on successful workspace deletion', async () => {
            const response = await request(app)
                .delete(`/api/v1/workspaces/${workspaceId}`)
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Workspace deleted successfully');
        });

        // TEST 2: Auth Check
        it('should return 401 if no auth token is provided', async () => {
            const response = await request(app)
                .delete(`/api/v1/workspaces/${workspaceId}`);

            // SECURITY CHECK: requireAuth middleware should intercept this
            expect(response.status).toBe(401);
        });
    });



});
