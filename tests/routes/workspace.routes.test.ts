import request from 'supertest';
import db from '../../src/lib/prisma';
import app from '../../src/app';

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

});
