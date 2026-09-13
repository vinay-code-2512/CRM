import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { createWorkspaceController, getWorkspacesController, addWorkspaceMemberController, removeWorkspaceMemberController, deleteWorkspaceController, updateWorkspaceMemberRoleController } from '../../src/controllers/workspace.controller';


describe('Workspace Controller', () => {
    let testUserId: string;

    beforeAll(async () => {
        try { await db.connect(); } catch (e) { }
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



    // ==========================================
    // 3. ADD WORKSPACE MEMBER CONTROLLER TESTS
    // ==========================================
    describe('addWorkspaceMemberController', () => {
        let workspaceId: number;
        let targetUser: any;

        beforeEach(async () => {
            // HOW: We need a workspace and a target user for the tests
            const req = { user: { userId: testUserId }, body: { name: 'Controller Workspace', description: '' } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await createWorkspaceController(req, res, next);
            workspaceId = res.json.mock.calls[0][0].id;

            targetUser = await UserModel.create({
                name: 'Controller Target',
                email: `controllertarget${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
        });

        // TEST 1: Happy Path — does it return 201 Created and the new membership?
        it('should return 201 and membership data on successful addition', async () => {
            // HOW: Fake the Bouncer providing testUserId, the URL param providing workspaceId, and the Body providing target data.
            const req = {
                user: { userId: testUserId },
                params: { id: String(workspaceId) },
                body: { email: targetUser.email, role: 'Member' }
            } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            // PURPOSE: Execute the new Controller directly
            await addWorkspaceMemberController(req, res, next);

            // SECURITY CHECK: Did it return 201 Created?
            expect(res.status).toHaveBeenCalledWith(201);

            // SECURITY CHECK: Did it return the expected membership record?
            const sentData = res.json.mock.calls[0][0];
            expect(sentData.workspaceId).toBe(workspaceId);
            expect(sentData.userId).toBe(targetUser.id);
            expect(sentData.role).toBe('Member');
        });

        // TEST 2: Error Path — does it slide errors to next()?
        it('should call next(error) if the target user does not exist', async () => {
            const req = {
                user: { userId: testUserId },
                params: { id: String(workspaceId) },
                body: { email: 'ghost@test.com', role: 'Member' }
            } as any;

            const res = { status: jest.fn().mockReturnThis(),json: jest.fn() } as any;
            const next = jest.fn() as any;

            await addWorkspaceMemberController(req, res, next);

            // SECURITY CHECK: If there is an error, the Controller must NEVER crash the server. It must slide it to next().
            expect(next).toHaveBeenCalled();
            const passedError = next.mock.calls[0][0];
            expect(passedError.statusCode).toBe(404);
            expect(passedError.message).toBe('User not found or not registered.');
        });
    });


        // ==========================================
    // 4. REMOVE WORKSPACE MEMBER CONTROLLER TESTS
    // ==========================================
    describe('removeWorkspaceMemberController', () => {
        let workspaceId: number;
        let targetUser: any;

        beforeEach(async () => {
            // Setup: Create a workspace and add a target user so we have someone to remove
            const req = { user: { userId: testUserId }, body: { name: 'Remove Controller Workspace', description: '' } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await createWorkspaceController(req, res, next);
            workspaceId = res.json.mock.calls[0][0].id;

            targetUser = await UserModel.create({
                name: 'Controller Target RM',
                email: `controllerrm${Math.random()}@test.com`,
                passwordHash: 'fake'
            });

            const addReq = {
                user: { userId: testUserId },
                params: { id: String(workspaceId) },
                body: { email: targetUser.email, role: 'Member' }
            } as any;
            await addWorkspaceMemberController(addReq, res, next);
        });

        // TEST 1: Happy Path
        it('should return 200 and success message on successful removal', async () => {
            // HOW: Fake the Bouncer providing testUserId, and the URL params providing the target details
            const req = {
                user: { userId: testUserId },
                params: { workspaceId: String(workspaceId), userId: String(targetUser.id) }
            } as any;

            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            // PURPOSE: Execute the Controller
            await removeWorkspaceMemberController(req, res, next);

            // SECURITY CHECK: Did it return 200 OK and our success message?
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0]).toEqual({ message: 'Member removed successfully' });
        });

        // TEST 2: Error Path
        it('should call next(error) if trying to remove the owner', async () => {
            const req = {
                user: { userId: testUserId },
                params: { workspaceId: String(workspaceId), userId: testUserId } // Trying to remove self (Owner)
            } as any;

            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await removeWorkspaceMemberController(req, res, next);

            // SECURITY CHECK: The Controller must slide the Service error safely to next()
            expect(next).toHaveBeenCalled();
            const passedError = next.mock.calls[0][0];
            expect(passedError.statusCode).toBe(400);
            expect(passedError.message).toBe('Cannot remove the Workspace Owner.');
        });
    });

    
    // ==========================================
    // 5. DELETE WORKSPACE CONTROLLER TESTS
    // ==========================================
    describe('deleteWorkspaceController', () => {
        let workspaceId: number;

        beforeEach(async () => {
            // Setup: Create a workspace so we have something to delete
            const req = { user: { userId: testUserId }, body: { name: 'Delete Controller Workspace', description: '' } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await createWorkspaceController(req, res, next);
            workspaceId = res.json.mock.calls[0][0].id;
        });

        // TEST 1: Happy Path
        it('should return 200 and success message on successful deletion', async () => {
            // HOW: Fake the Bouncer providing testUserId, and the URL params providing the workspaceId
            const req = {
                user: { userId: testUserId },
                params: { id: String(workspaceId) }
            } as any;

            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            // Execute the Controller
            await deleteWorkspaceController(req, res, next);

            // SECURITY CHECK: Did it return 200 OK and our success message?
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0]).toEqual({ message: 'Workspace deleted successfully' });
        });

        // TEST 2: Error Path
        it('should call next(error) if trying to delete a non-existent workspace', async () => {
            const req = {
                user: { userId: testUserId },
                params: { id: '999999' } // Fake ID
            } as any;

            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await deleteWorkspaceController(req, res, next);

            // SECURITY CHECK: The Controller must slide the Service error safely to next()
            expect(next).toHaveBeenCalled();
            const passedError = next.mock.calls[0][0];
            expect(passedError.statusCode).toBe(404);
            expect(passedError.message).toBe('Workspace not found.');
        });
    });


        // ==========================================
    // 6. UPDATE WORKSPACE MEMBER ROLE CONTROLLER TESTS
    // ==========================================
    describe('updateWorkspaceMemberRoleController', () => {
        let workspaceId: number;

        beforeEach(async () => {
            const req = { user: { userId: testUserId }, body: { name: 'Role Controller Workspace', description: '' } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await createWorkspaceController(req, res, next);
            workspaceId = res.json.mock.calls[0][0].id;
        });

        // TEST 1: Happy Path
        it('should return 200 and updated role on successful promotion', async () => {
            // Setup: Add a member to the workspace first
            const memberUser = await UserModel.create({ name: 'RoleTarget', email: `roletarget${Math.random()}@test.com`, passwordHash: 'fake' });
            await addWorkspaceMemberController(
                { user: { userId: testUserId }, params: { id: String(workspaceId) }, body: { email: memberUser.email, role: 'Member' } } as any,
                { status: jest.fn().mockReturnThis(), json: jest.fn() } as any,
                jest.fn() as any
            );

            // Execute Controller: Promote them to Admin
            const req = {
                user: { userId: testUserId },
                params: { workspaceId: String(workspaceId), userId: String(memberUser.id) },
                body: { role: 'Admin' }
            } as any;

            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await updateWorkspaceMemberRoleController(req, res, next);

            // Verify
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0].message).toBe('Member role updated successfully');
            expect(res.json.mock.calls[0][0].member.role).toBe('Admin');
        });

        // TEST 2: Error Path (Invalid role)
        it('should call next(error) if role is invalid', async () => {
            const req = {
                user: { userId: testUserId },
                params: { workspaceId: String(workspaceId), userId: '999999' },
                body: { role: 'SuperAdmin' } // Invalid role
            } as any;

            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await updateWorkspaceMemberRoleController(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400); // Because 'SuperAdmin' is rejected by the Service
        });
    });

});
