import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { createWorkspaceController, getWorkspacesController } from '../../src/controllers/workspace.controller';

describe('Workspace Controller', () => {
    let testUserId: string;

    beforeAll(async () => {
        try { await db.connect(); } catch(e) {}
    });

    // Before each test: create a fresh user
    beforeEach(async () => {
        const user = await UserModel.create({
            name: 'Controller Test User',
            email: `controller${Math.random()}@test.com`,
            passwordHash: 'fakehashedpassword'
        });
        testUserId = String(user.id);
    });

    // After each test: wipe all data for isolation
    afterEach(async () => {
        await (db.orm as any).public.WorkspaceMember.deleteAll();
        await (db.orm as any).public.Workspace.deleteAll();
        await (db.orm as any).public.User.deleteAll();
    });

    // ==========================================
    // 1. CREATE WORKSPACE CONTROLLER TESTS
    // ==========================================
    describe('createWorkspaceController', () => {

        // TEST 1: Happy Path — does it return 201?
        it('should return 201 on successful workspace creation', async () => {
            // HOW: Fake the req — the Bouncer already put userId inside!
            const req = {
                user: { userId: testUserId },
                body: { name: 'Controller Workspace', description: 'Testing the controller' }
            } as any;

            // HOW: Fake the response with spy cameras
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            // PURPOSE: Execute the Controller directly
            await createWorkspaceController(req, res, next);

            // SECURITY CHECK: Did the Controller return 201 Created?
            expect(res.status).toHaveBeenCalledWith(201);

            // SECURITY CHECK: Did it return workspace data?
            const sentData = res.json.mock.calls[0][0];
            expect(sentData.name).toBe('Controller Workspace');
            expect(sentData.description).toBe('Testing the controller');
            expect(sentData.id).toBeDefined();
        });

        // TEST 2: Does it return workspace data without description?
        it('should return 201 even without a description', async () => {
            const req = {
                user: { userId: testUserId },
                body: { name: 'No Desc Controller Workspace' }
            } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await createWorkspaceController(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json.mock.calls[0][0].name).toBe('No Desc Controller Workspace');
        });

        // TEST 3: Does it forward errors to next()?
        it('should call next(error) if service throws an error', async () => {
            // HOW: Use an invalid userId that will cause the service to fail
            const req = {
                user: { userId: 'not-a-number' },
                body: { name: 'Should Fail' }
            } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await createWorkspaceController(req, res, next);

            // SECURITY CHECK: The error must slide to the Global Error Handler
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
        });
    });

    // ==========================================
    // 2. GET WORKSPACES CONTROLLER TESTS
    // ==========================================
    describe('getWorkspacesController', () => {

        // TEST 1: Happy Path — does it return 200 with an array?
        it('should return 200 and an array of workspaces', async () => {
            // First, create a workspace so there's something to fetch
            const createReq = {
                user: { userId: testUserId },
                body: { name: 'Fetchable Workspace', description: 'Should appear in list' }
            } as any;
            const createRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const createNext = jest.fn() as any;
            await createWorkspaceController(createReq, createRes, createNext);

            // Now test getWorkspacesController
            const req = {
                user: { userId: testUserId }
            } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await getWorkspacesController(req, res, next);

            // SECURITY CHECK: Must return 200 OK
            expect(res.status).toHaveBeenCalledWith(200);

            // SECURITY CHECK: Must return an array with our workspace
            const sentData = res.json.mock.calls[0][0];
            expect(Array.isArray(sentData)).toBe(true);
            expect(sentData.length).toBeGreaterThan(0);
            expect(sentData[0].name).toBe('Fetchable Workspace');
        });

        // TEST 2: Should return empty array for user with no workspaces
        it('should return 200 and an empty array if user has no workspaces', async () => {
            const req = {
                user: { userId: testUserId }
            } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await getWorkspacesController(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0]).toEqual([]);
        });
    });
});
