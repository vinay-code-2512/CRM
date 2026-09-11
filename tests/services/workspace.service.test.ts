import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { WorkspaceMemberModel } from '../../src/models/WorkspaceMemberPrisma';
import { createWorkspace, getUserWorkspaces, addWorkspaceMember, removeWorkspaceMember } from '../../src/services/workspace.service';

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
    

        // ==========================================
    // 3. addWorkspaceMember TESTS
    // ==========================================
    describe('addWorkspaceMember', () => {
        let workspaceId: number;
        let targetUser: any;

        beforeEach(async () => {
            // Setup a base workspace owned by testUserId
            const workspace = await createWorkspace(testUserId, { name: 'Add Member Test Workspace', description: '' });
            workspaceId = workspace.id;

            // Setup a target user to be added
            targetUser = await UserModel.create({
                name: 'Target User',
                email: `target${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
        });

        // 1. Successful addition by a Workspace Owner.
        // 9. Verify that the WorkspaceMember record is actually created with the correct workspaceId, userId, and role.
        it('should allow Workspace Owner to add a member and create the record', async () => {
            const membership = await addWorkspaceMember(testUserId, String(workspaceId), targetUser.email, 'Member');
            
            expect(membership.workspaceId).toBe(workspaceId);
            expect(membership.userId).toBe(targetUser.id);
            expect(membership.role).toBe('Member');

            // Verify DB record using WorkspaceMemberModel
            const dbRecord = await WorkspaceMemberModel.findByWorkspaceAndUser(workspaceId, targetUser.id);
            expect(dbRecord).not.toBeNull();
            expect(dbRecord!.role).toBe('Member');
        });

        // 2. Successful addition by a Workspace Admin.
        it('should allow Workspace Admin to add a member', async () => {
            // First, make another user an Admin
            const adminUser = await UserModel.create({ name: 'Admin', email: `admin${Math.random()}@test.com`, passwordHash: 'fake' });
            await WorkspaceMemberModel.create({ workspaceId, userId: adminUser.id, role: 'Admin' });
            
            const membership = await addWorkspaceMember(String(adminUser.id), String(workspaceId), targetUser.email, 'Member');
            expect(membership.userId).toBe(targetUser.id);
        });

        // 3. Reject a requester who is a normal Workspace Member with 403.
        it('should reject a requester who is a normal Workspace Member with 403', async () => {
            const memberUser = await UserModel.create({ name: 'Member', email: `member${Math.random()}@test.com`, passwordHash: 'fake' });
            await WorkspaceMemberModel.create({ workspaceId, userId: memberUser.id, role: 'Member' });
            
            await expect(addWorkspaceMember(String(memberUser.id), String(workspaceId), targetUser.email, 'Member'))
                .rejects.toMatchObject({ statusCode: 403 });
        });

        // 4. Reject a requester who is not a member of the workspace with 403.
        it('should reject a requester who is not a member of the workspace with 403', async () => {
            const randoUser = await UserModel.create({ name: 'Rando', email: `rando${Math.random()}@test.com`, passwordHash: 'fake' });
            
            await expect(addWorkspaceMember(String(randoUser.id), String(workspaceId), targetUser.email, 'Member'))
                .rejects.toMatchObject({ statusCode: 403 });
        });

        // 5. Reject an unregistered target email with 404.
        it('should reject an unregistered target email with 404', async () => {
            await expect(addWorkspaceMember(testUserId, String(workspaceId), 'nobody@test.com', 'Member'))
                .rejects.toMatchObject({ statusCode: 404 });
        });

        // 6. Reject a target user who is already a member with 400.
        it('should reject a target user who is already a member with 400', async () => {
            await WorkspaceMemberModel.create({ workspaceId, userId: targetUser.id, role: 'Member' });
            
            await expect(addWorkspaceMember(testUserId, String(workspaceId), targetUser.email, 'Member'))
                .rejects.toMatchObject({ statusCode: 400 });
        });

        // 7. Reject an invalid target role.
        it('should reject an invalid target role with 400', async () => {
            await expect(addWorkspaceMember(testUserId, String(workspaceId), targetUser.email, 'SuperAdmin' as any))
                .rejects.toMatchObject({ statusCode: 400 });
        });

        // 8. Allow only Admin or Member as the role assigned to the new member.
        it('should reject assigning the Owner role with 400', async () => {
            await expect(addWorkspaceMember(testUserId, String(workspaceId), targetUser.email, 'Owner'))
                .rejects.toMatchObject({ statusCode: 400 });
        });
    });


    // ==========================================
    // 4. removeWorkspaceMember TESTS
    // ==========================================
    describe('removeWorkspaceMember', () => {
        let workspaceId: number;
        let targetUser: any;
        let targetUserId: string;

        beforeEach(async () => {
            // Setup a base workspace owned by testUserId
            const workspace = await createWorkspace(testUserId, { name: 'Remove Member Test Workspace', description: '' });
            workspaceId = workspace.id;

            // Setup a target user
            targetUser = await UserModel.create({
                name: 'Target User',
                email: `targetremove${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
            targetUserId = String(targetUser.id);
            
            // Pre-add the target user as a Member manually so we can test removing them
            await WorkspaceMemberModel.create({
                workspaceId,
                userId: targetUser.id,
                role: 'Member'
            });
        });

        // 1. Owner can remove a Member successfully.
        // Verify that the target WorkspaceMember record is actually deleted (but user remains).
        it('should allow Workspace Owner to remove a member and delete the record', async () => {
            await removeWorkspaceMember(testUserId, String(workspaceId), targetUserId);
            
            // Verify DB record using WorkspaceMemberModel is gone
            const dbRecord = await WorkspaceMemberModel.findByWorkspaceAndUser(workspaceId, targetUser.id);
            expect(dbRecord).toBeNull();
            
            // Verify the User themselves wasn't accidentally deleted
            const userCheck = await UserModel.findById(targetUser.id);
            expect(userCheck).not.toBeNull();
        });

        // 2. Admin can remove a Member successfully.
        it('should allow Workspace Admin to remove a member', async () => {
            // First, make another user an Admin
            const adminUser = await UserModel.create({ name: 'Admin', email: `adminrm${Math.random()}@test.com`, passwordHash: 'fake' });
            await WorkspaceMemberModel.create({ workspaceId, userId: adminUser.id, role: 'Admin' });
            
            await removeWorkspaceMember(String(adminUser.id), String(workspaceId), targetUserId);
            
            const dbRecord = await WorkspaceMemberModel.findByWorkspaceAndUser(workspaceId, targetUser.id);
            expect(dbRecord).toBeNull();
        });

        // 3. Normal Member requester gets 403.
        it('should reject a requester who is a normal Workspace Member with 403', async () => {
            const memberUser = await UserModel.create({ name: 'Member', email: `memberrm${Math.random()}@test.com`, passwordHash: 'fake' });
            await WorkspaceMemberModel.create({ workspaceId, userId: memberUser.id, role: 'Member' });
            
            await expect(removeWorkspaceMember(String(memberUser.id), String(workspaceId), targetUserId))
                .rejects.toMatchObject({ statusCode: 403 });
        });

        // 4. Non-member requester gets 403.
        it('should reject a requester who is not a member of the workspace with 403', async () => {
            const randoUser = await UserModel.create({ name: 'Rando', email: `randorm${Math.random()}@test.com`, passwordHash: 'fake' });
            
            await expect(removeWorkspaceMember(String(randoUser.id), String(workspaceId), targetUserId))
                .rejects.toMatchObject({ statusCode: 403 });
        });

        // 5. Target user is not a member of the workspace -> 404.
        it('should reject if the target user is not a member with 404', async () => {
            const nonMemberUser = await UserModel.create({ name: 'Not In Workspace', email: `notinws${Math.random()}@test.com`, passwordHash: 'fake' });
            
            await expect(removeWorkspaceMember(testUserId, String(workspaceId), String(nonMemberUser.id)))
                .rejects.toMatchObject({ statusCode: 404 });
        });

        // 6. Target is the Workspace Owner -> 400.
        it('should reject attempting to remove the Workspace Owner with 400', async () => {
            await expect(removeWorkspaceMember(testUserId, String(workspaceId), testUserId))
                .rejects.toMatchObject({ statusCode: 400 });
        });

        // 7. Admin attempting to remove the Owner -> 400.
        it('should reject an Admin attempting to remove the Workspace Owner with 400', async () => {
            const adminUser = await UserModel.create({ name: 'Admin', email: `adminrm2${Math.random()}@test.com`, passwordHash: 'fake' });
            await WorkspaceMemberModel.create({ workspaceId, userId: adminUser.id, role: 'Admin' });
            
            await expect(removeWorkspaceMember(String(adminUser.id), String(workspaceId), testUserId))
                .rejects.toMatchObject({ statusCode: 400 });
        });
    });

    
});
 