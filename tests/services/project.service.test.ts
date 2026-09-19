import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { WorkspaceMemberModel } from '../../src/models/WorkspaceMemberPrisma';
import { ProjectModel } from '../../src/models/ProjectPrisma';
import { ProjectMemberModel } from '../../src/models/ProjectMemberPrisma';
import { createProject, getProjects, updateProject, addProjectMember } from '../../src/services/project.service';
import { createWorkspace } from '../../src/services/workspace.service';

describe('Project Service', () => {
    let testUserId: string;
    let testWorkspaceId: string;

    beforeAll(async () => {
        await db.connect();
    });

    beforeEach(async () => {
        const user = await UserModel.create({
            name: 'Project Test User',
            email: `project${Math.random()}@test.com`,
            passwordHash: 'fakehash',
        });
        testUserId = String(user.id);

        const workspace = await createWorkspace(testUserId, { name: 'Test WS', description: '' });
        testWorkspaceId = String(workspace.id);
    });

    afterEach(async () => {
        await (db.orm as any).public.ProjectMember.deleteAll();
        await (db.orm as any).public.Project.deleteAll();
        await (db.orm as any).public.WorkspaceMember.deleteAll();
        await (db.orm as any).public.Workspace.deleteAll();
        await (db.orm as any).public.User.deleteAll();
    });

    // ==========================================
    // 1. createProject TESTS
    // ==========================================
    describe('createProject', () => {

        it('should create a project and return it with an id', async () => {
            const project = await createProject(testUserId, testWorkspaceId, {
                name: 'Sprint 3 Project',
                description: 'Testing project creation',
            });

            expect(project).toHaveProperty('id');
            expect(project.name).toBe('Sprint 3 Project');
            expect(project.description).toBe('Testing project creation');
            expect(project.workspaceId).toBe(Number(testWorkspaceId));
            expect(project.isArchived).toBe(false);
        });

        it('should auto-add the creator as a ProjectMember', async () => {
            const project = await createProject(testUserId, testWorkspaceId, { name: 'Auto-Member Project' });

            const membership = await ProjectMemberModel.findByProjectAndUser(project.id, Number(testUserId));
            expect(membership).not.toBeNull();
            expect(membership!.projectId).toBe(project.id);
            expect(membership!.userId).toBe(Number(testUserId));
        });

        it('should allow creation without a description', async () => {
            const project = await createProject(testUserId, testWorkspaceId, { name: 'No Desc Project' });

            expect(project.name).toBe('No Desc Project');
            expect(project.description).toBeNull();
        });

        it('should allow an Admin to create a project', async () => {
            const adminUser = await UserModel.create({
                name: 'Admin User',
                email: `admin${Math.random()}@test.com`,
                passwordHash: 'fake',
            });
            await WorkspaceMemberModel.create({
                workspaceId: Number(testWorkspaceId),
                userId: adminUser.id,
                role: 'Admin',
            });

            const project = await createProject(String(adminUser.id), testWorkspaceId, { name: 'Admin Project' });

            expect(project).toHaveProperty('id');
            expect(project.name).toBe('Admin Project');
        });

        it('should reject a Member trying to create a project', async () => {
            const memberUser = await UserModel.create({
                name: 'Member User',
                email: `member${Math.random()}@test.com`,
                passwordHash: 'fake',
            });
            await WorkspaceMemberModel.create({
                workspaceId: Number(testWorkspaceId),
                userId: memberUser.id,
                role: 'Member',
            });

            await expect(
                createProject(String(memberUser.id), testWorkspaceId, { name: 'Forbidden Project' })
            ).rejects.toMatchObject({ statusCode: 403 });
        });

        it('should reject a non-workspace user trying to create a project', async () => {
            const outsider = await UserModel.create({
                name: 'Outsider',
                email: `outsider${Math.random()}@test.com`,
                passwordHash: 'fake',
            });

            await expect(
                createProject(String(outsider.id), testWorkspaceId, { name: 'Hacked Project' })
            ).rejects.toMatchObject({ statusCode: 403 });
        });
    });

    // ==========================================
    // 2. getProjects TESTS
    // ==========================================
    describe('getProjects', () => {

        it('should return all non-archived projects in the workspace', async () => {
            await createProject(testUserId, testWorkspaceId, { name: 'Project A' });
            await createProject(testUserId, testWorkspaceId, { name: 'Project B' });

            const projects = await getProjects(testUserId, testWorkspaceId);

            expect(Array.isArray(projects)).toBe(true);
            expect(projects.length).toBe(2);
        });

        it('should return empty array if no projects exist', async () => {
            const projects = await getProjects(testUserId, testWorkspaceId);
            expect(projects).toEqual([]);
        });

        it('should reject a non-member trying to list projects', async () => {
            const outsider = await UserModel.create({
                name: 'Outsider',
                email: `outsider${Math.random()}@test.com`,
                passwordHash: 'fake',
            });

            await expect(
                getProjects(String(outsider.id), testWorkspaceId)
            ).rejects.toMatchObject({ statusCode: 403 });
        });
    });


    describe('updateProject', () => {
        let testProjectId: string;

        beforeEach(async () => {
            const project = await ProjectModel.create({
                workspaceId: Number(testWorkspaceId),
                name: 'Original Project',
                description: 'Original Desc'
            });
            testProjectId = String(project.id);
        });

        it('should allow an Owner to update the project name and description', async () => {
            const updated = await updateProject(testUserId, testProjectId, {
                name: 'Updated Name',
                description: 'Updated Desc'
            });

            expect(updated?.name).toBe('Updated Name');
            expect(updated?.description).toBe('Updated Desc');
            expect(updated?.isArchived).toBe(false); // Should remain unchanged
        });

        it('should allow an Admin to archive a project', async () => {
            // Make user Admin
            await WorkspaceMemberModel.updateRole(Number(testWorkspaceId), Number(testUserId), 'Admin');

            const updated = await updateProject(testUserId, testProjectId, {
                isArchived: true
            });

            expect(updated?.isArchived).toBe(true);
            expect(updated?.name).toBe('Original Project'); // Should remain unchanged
        });

        it('should reject a regular Member trying to update the project', async () => {
            // Make user Member
            await WorkspaceMemberModel.updateRole(Number(testWorkspaceId), Number(testUserId), 'Member');

            await expect(
                updateProject(testUserId, testProjectId, { name: 'Hacked Name' })
            ).rejects.toThrow('Access denied. Only Workspace Owners and Admins can update projects.');
        });

        it('should reject a non-workspace user trying to update the project', async () => {
            // Remove user from workspace
            await WorkspaceMemberModel.delete(Number(testWorkspaceId), Number(testUserId));

            await expect(
                updateProject(testUserId, testProjectId, { name: 'Hacked Name' })
            ).rejects.toThrow('Access denied. You are not a member of this workspace.');
        });

        it('should throw 404 if project does not exist', async () => {
            await expect(
                updateProject(testUserId, '9999', { name: 'Ghost Project' })
            ).rejects.toThrow('Project not found');
        });
    });


    describe('addProjectMember', () => {
        let testProjectId: string;
        let testTargetUserId: string;

        beforeEach(async () => {
            // Setup: Create a project
            const project = await ProjectModel.create({
                workspaceId: Number(testWorkspaceId),
                name: 'Membership Project'
            });
            testProjectId = String(project.id);

            // Setup: Create a second user
            const targetUser = await UserModel.create({
                name: 'Target User',
                email: `target${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
            testTargetUserId = String(targetUser.id);
        });

        it('should allow an Owner to add a workspace member to the project', async () => {
            // Add target user to workspace first
            await WorkspaceMemberModel.create({
                workspaceId: Number(testWorkspaceId),
                userId: Number(testTargetUserId),
                role: 'Member'
            });

            // testUserId is already the Owner (default from outer beforeEach)
            const member = await addProjectMember(testUserId, testProjectId, testTargetUserId);

            expect(member).toHaveProperty('id');
            expect(member.projectId).toBe(Number(testProjectId));
            expect(member.userId).toBe(Number(testTargetUserId));
        });

        it('should allow an Admin to add a workspace member to the project', async () => {
            // Add target user to workspace first
            await WorkspaceMemberModel.create({
                workspaceId: Number(testWorkspaceId),
                userId: Number(testTargetUserId),
                role: 'Member'
            });

            // Make requester an Admin
            await WorkspaceMemberModel.updateRole(Number(testWorkspaceId), Number(testUserId), 'Admin');

            const member = await addProjectMember(testUserId, testProjectId, testTargetUserId);

            expect(member).toHaveProperty('id');
            expect(member.projectId).toBe(Number(testProjectId));
            expect(member.userId).toBe(Number(testTargetUserId));
        });

        it('should reject if target user is NOT in the workspace', async () => {
            await expect(
                addProjectMember(testUserId, testProjectId, testTargetUserId)
            ).rejects.toThrow('Cannot add user: The user must be a member of the workspace first.');
        });

        it('should reject if user is already in the project', async () => {
            // Add target to workspace
            await WorkspaceMemberModel.create({
                workspaceId: Number(testWorkspaceId),
                userId: Number(testTargetUserId),
                role: 'Member'
            });

            // Add to project (first time works)
            await addProjectMember(testUserId, testProjectId, testTargetUserId);

            // Add again (should fail)
            await expect(
                addProjectMember(testUserId, testProjectId, testTargetUserId)
            ).rejects.toThrow('User is already a member of this project.');
        });

        it('should reject if requester is just a regular Member', async () => {
            // Add target to workspace
            await WorkspaceMemberModel.create({
                workspaceId: Number(testWorkspaceId),
                userId: Number(testTargetUserId),
                role: 'Member'
            });

            // Demote requester to Member
            await WorkspaceMemberModel.updateRole(Number(testWorkspaceId), Number(testUserId), 'Member');

            await expect(
                addProjectMember(testUserId, testProjectId, testTargetUserId)
            ).rejects.toThrow('Access denied. Only Workspace Owners and Admins can add project members.');
        });
    });
});
