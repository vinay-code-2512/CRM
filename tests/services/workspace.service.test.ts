import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { createWorkspace, getUserWorkspaces } from '../../src/services/workspace.service';

describe('Workspace Service', () => {
    let testUserId: string;

    beforeAll(async () => {
        await db.connect();
    });

    // Before each test: create a fresh user so we have a valid userId
    beforeEach(async () => {
        const user = await UserModel.create({
            name: 'Service Test User',
            email: `service${Math.random()}@test.com`,
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
    // 1. createWorkspace TESTS
    // ==========================================
    describe('createWorkspace', () => {

        // TEST 1: The Happy Path — does it create a workspace?
        it('should create a workspace and return it with an id', async () => {
            const workspace = await createWorkspace(testUserId, {
                name: 'Test Workspace',
                description: 'A workspace for testing'
            });

            // Verify the returned workspace has the correct data
            expect(workspace).toHaveProperty('id');
            expect(workspace.name).toBe('Test Workspace');
            expect(workspace.description).toBe('A workspace for testing');
        });

        // TEST 2: Does it automatically add the creator as Owner?
        it('should add the creator as Owner in WorkspaceMember table', async () => {
            const workspace = await createWorkspace(testUserId, {
                name: 'Owner Check Workspace',
                description: 'Testing ownership'
            });

            // DATABASE CHECK: Go directly to WorkspaceMember table
            const membership = await (db.orm as any).public.WorkspaceMember
                .where({ workspaceId: workspace.id, userId: Number(testUserId) })
                .first();

            expect(membership).not.toBeNull();
            expect(membership.role).toBe('Owner');
        });

        // TEST 3: Does it work without a description?
        it('should create a workspace without a description', async () => {
            const workspace = await createWorkspace(testUserId, {
                name: 'No Desc Workspace',
                description: undefined as any
            });

            expect(workspace).toHaveProperty('id');
            expect(workspace.name).toBe('No Desc Workspace');
        });
    });

    // ==========================================
    // 2. getUserWorkspaces TESTS
    // ==========================================
    describe('getUserWorkspaces', () => {

        // TEST 1: Should return workspaces the user belongs to
        it('should return all workspaces the user is a member of', async () => {
            // Create two workspaces for this user
            await createWorkspace(testUserId, { name: 'Workspace One', description: 'First' });
            await createWorkspace(testUserId, { name: 'Workspace Two', description: 'Second' });

            const workspaces = await getUserWorkspaces(testUserId);

            expect(workspaces).toHaveLength(2);
            // Check that both workspace names are present
            const names = workspaces.map((w: any) => w.name);
            expect(names).toContain('Workspace One');
            expect(names).toContain('Workspace Two');
        });

        // TEST 2: Should return empty array if user has no workspaces
        it('should return an empty array if user has no workspaces', async () => {
            const workspaces = await getUserWorkspaces(testUserId);

            expect(workspaces).toEqual([]);
        });

        // TEST 3: Should NOT return workspaces from other users
        it('should not return workspaces belonging to other users', async () => {
            // Create a workspace for our test user
            await createWorkspace(testUserId, { name: 'My Workspace', description: 'Mine' });

            // Create a DIFFERENT user
            const otherUser = await UserModel.create({
                name: 'Other User',
                email: `other${Math.random()}@test.com`,
                passwordHash: 'fakehashedpassword'
            });
            const otherUserId = String(otherUser.id);

            // Create a workspace for the OTHER user
            await createWorkspace(otherUserId, { name: 'Not My Workspace', description: 'Theirs' });

            // Fetch workspaces for our original test user
            const workspaces = await getUserWorkspaces(testUserId);

            // Should only see our own workspace, not the other user's
            expect(workspaces).toHaveLength(1);
            expect(workspaces[0].name).toBe('My Workspace');
        });
    });
});
