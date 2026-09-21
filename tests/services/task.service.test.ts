import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { WorkspaceModel } from '../../src/models/WorkspacePrisma';
import { WorkspaceMemberModel } from '../../src/models/WorkspaceMemberPrisma';
import { ProjectModel } from '../../src/models/ProjectPrisma';
import { ProjectMemberModel } from '../../src/models/ProjectMemberPrisma';
import { TaskModel } from '../../src/models/TaskPrisma'
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from '../../src/services/task.service';

describe('Task Service', () => {
    let testUserId: string;
    let testWorkspaceId: string;
    let testProjectId: string;

    beforeAll(async () => {
        await db.connect();
    });

    beforeEach(async () => {
        // 1. Create a user
        const user = await UserModel.create({
            name: 'Task Test User',
            email: `task${Math.random()}@test.com`,
            passwordHash: 'fake'
        });
        testUserId = String(user.id);

        // 2. Create a workspace and make user Owner
        const workspace = await WorkspaceModel.create({ name: 'Task WS', description: '' });
        testWorkspaceId = String(workspace.id);
        await WorkspaceMemberModel.create({
            workspaceId: workspace.id,
            userId: user.id,
            role: 'Owner'
        });

        // 3. Create a project and add user as a ProjectMember
        const project = await ProjectModel.create({
            workspaceId: workspace.id,
            name: 'Task Project'
        });
        testProjectId = String(project.id);
        await ProjectMemberModel.create({
            projectId: project.id,
            userId: user.id
        });
    });

    afterEach(async () => {
        await (db.orm as any).public.Task.deleteAll();
        await (db.orm as any).public.ProjectMember.deleteAll();
        await (db.orm as any).public.Project.deleteAll();
        await (db.orm as any).public.WorkspaceMember.deleteAll();
        await (db.orm as any).public.Workspace.deleteAll();
        await (db.orm as any).public.User.deleteAll();
    });

    describe('createTask', () => {

        it('should create a task with just a title (minimal input)', async () => {
            const task = await createTask(testUserId, testProjectId, {
                title: 'My First Task'
            });

            expect(task).toHaveProperty('id');
            expect(task.title).toBe('My First Task');
            expect(task.status).toBe('Todo');        // Default from DB
            expect(task.priority).toBe('Medium');    // Default from service
            expect(task.projectId).toBe(Number(testProjectId));
        });

        it('should create a task with all fields provided', async () => {
            const task = await createTask(testUserId, testProjectId, {
                title: 'Full Task',
                description: 'Detailed description',
                priority: 'High',
                labels: ['backend', 'urgent'],
                dueDate: '2026-12-31T00:00:00.000Z'
            });

            expect(task.title).toBe('Full Task');
            expect(task.description).toBe('Detailed description');
            expect(task.priority).toBe('High');
            expect(task.labels).toEqual(['backend', 'urgent']);
            expect(task.dueDate).toBeTruthy();
        });

        it('should reject if user is NOT a project member', async () => {
            // Create a second user who is NOT in the project
            const outsider = await UserModel.create({
                name: 'Outsider',
                email: `outsider${Math.random()}@test.com`,
                passwordHash: 'fake'
            });

            await expect(
                createTask(String(outsider.id), testProjectId, { title: 'Hacked Task' })
            ).rejects.toThrow('Access denied. You must be a project member to create tasks.');
        });

        it('should reject if project is archived', async () => {
            // Archive the project first
            await ProjectModel.update(Number(testProjectId), { isArchived: true });

            await expect(
                createTask(testUserId, testProjectId, { title: 'Dead Project Task' })
            ).rejects.toThrow('Cannot create tasks in an archived project.');
        });

        it('should throw 404 if project does not exist', async () => {
            await expect(
                createTask(testUserId, '9999', { title: 'Ghost Task' })
            ).rejects.toThrow('Project not found');
        });
    });

    describe('View Tasks (getTasks & getTaskById)', () => {
        let testTaskId1: number;
        let testTaskId2: number;

        beforeEach(async () => {
            // Setup some tasks for us to retrieve
            const task1 = await TaskModel.create({
                projectId: Number(testProjectId),
                title: 'First Test Task',
                priority: 'High'
            });
            testTaskId1 = Number(task1.id);

            const task2 = await TaskModel.create({
                projectId: Number(testProjectId),
                title: 'Second Test Task',
                priority: 'Low'
            });
            testTaskId2 = Number(task2.id);
        });

        describe('getTasks (List)', () => {
            it('should return all tasks for a valid project member', async () => {
                const tasks = await getTasks(testUserId, testProjectId);
                expect(tasks.length).toBe(2);
                expect(tasks[0].title).toBe('First Test Task');
                expect(tasks[1].title).toBe('Second Test Task');
            });

            it('should reject if user is not a project member', async () => {
                const outsider = await UserModel.create({
                    name: 'Outsider',
                    email: `outsider2${Math.random()}@test.com`,
                    passwordHash: 'fake'
                });

                await expect(
                    getTasks(String(outsider.id), testProjectId)
                ).rejects.toThrow('Access denied. You must be a project member to view tasks.');
            });
        });

        describe('getTaskById (Single)', () => {
            it('should return a specific task for a valid project member', async () => {
                const task = await getTaskById(testUserId, testProjectId, String(testTaskId1));
                expect(task.title).toBe('First Test Task');
                expect(task.priority).toBe('High');
            });

            it('should throw 404 if task does not exist', async () => {
                await expect(
                    getTaskById(testUserId, testProjectId, '999999')
                ).rejects.toThrow('Task not found');
            });

            it('should throw 400 if task belongs to a different project', async () => {
                // Try to access testTaskId1 using project ID 999
                await expect(
                    getTaskById(testUserId, '999', String(testTaskId1))
                ).rejects.toThrow('Task does not belong to this project');
            });
        });
    });

    describe('updateTask', () => {
        let testTaskId: number;

        beforeEach(async () => {
            // Setup a task to update
            const task = await TaskModel.create({
                projectId: Number(testProjectId),
                title: 'Original Title',
                priority: 'Low',
                dueDate: (globalThis as any).Temporal.Instant.from('2026-10-01T00:00:00Z')
            });
            testTaskId = Number(task.id);
        });

        it('should update specific fields of a task', async () => {
            const updated = await updateTask(testUserId, testProjectId, String(testTaskId), {
                title: 'Updated Title',
                priority: 'High'
            });

            expect(updated.title).toBe('Updated Title');
            expect(updated.priority).toBe('High');
            // Description wasn't passed, so it should stay null
            expect(updated.description).toBeNull();
        });

        it('should clear the dueDate when passed null', async () => {
            const updated = await updateTask(testUserId, testProjectId, String(testTaskId), {
                dueDate: null
            });

            expect(updated.dueDate).toBeNull();
        });

        it('should reject if user is not a project member', async () => {
            const outsider = await UserModel.create({
                name: 'Outsider',
                email: `outsider3${Math.random()}@test.com`,
                passwordHash: 'fake'
            });

            await expect(
                updateTask(String(outsider.id), testProjectId, String(testTaskId), { title: 'Hacked' })
            ).rejects.toThrow('Access denied. You must be a project member to update tasks.');
        });

        it('should throw 400 if task belongs to a different project', async () => {
            await expect(
                updateTask(testUserId, '999', String(testTaskId), { title: 'Oops' })
            ).rejects.toThrow('Task does not belong to this project');
        });
        it('should assign a task if target is a project member', async () => {
            // Create a valid member to assign to
            const memberUser = await UserModel.create({
                name: 'Valid Member',
                email: `member${Math.random()}@test.com`,
                passwordHash: 'fake'
            });
            await ProjectMemberModel.create({ projectId: Number(testProjectId), userId: memberUser.id });

            const updated = await updateTask(testUserId, testProjectId, String(testTaskId), {
                assigneeId: String(memberUser.id)
            });

            expect(updated.assigneeId).toBe(Number(memberUser.id));
        });

        it('should reject assignment if target is NOT a project member', async () => {
            // Create an outsider
            const outsiderUser = await UserModel.create({
                name: 'Outsider Assigee',
                email: `outsider_assignee${Math.random()}@test.com`,
                passwordHash: 'fake'
            });

            await expect(
                updateTask(testUserId, testProjectId, String(testTaskId), { assigneeId: String(outsiderUser.id) })
            ).rejects.toThrow('Cannot assign task: Target user is not a member of this project.');
        });

        it('should successfully update task status', async () => {
            const updated = await updateTask(testUserId, testProjectId, String(testTaskId), {
                status: 'In Progress'
            });

            expect(updated.status).toBe('In Progress');
        });

        it('should reject invalid statuses', async () => {
            await expect(
                updateTask(testUserId, testProjectId, String(testTaskId), { status: 'Super Done' })
            ).rejects.toThrow('Invalid status. Allowed values are: Todo, In Progress, Review, Done');
        });

        it('should successfully update task priority', async () => {
            const updated = await updateTask(testUserId, testProjectId, String(testTaskId), {
                priority: 'Low'
            });

            expect(updated.priority).toBe('Low');
        });

        it('should reject invalid priorities', async () => {
            await expect(
                updateTask(testUserId, testProjectId, String(testTaskId), { priority: 'Super Important' })
            ).rejects.toThrow('Invalid priority. Allowed values are: Low, Medium, High, Urgent');
        });

    });


    describe('deleteTask', () => {
        let testTaskId: number;

        beforeEach(async () => {
            // Setup a task to delete before each test
            const task = await TaskModel.create({
                projectId: Number(testProjectId),
                title: 'Task to Delete',
                priority: 'Low'
            });
            testTaskId = Number(task.id);
        });

        it('should successfully delete a task', async () => {
            // 1. Delete the task
            await deleteTask(testUserId, testProjectId, String(testTaskId));

            // 2. Try to fetch it again, it should be null/not found
            const taskInDb = await TaskModel.findById(testTaskId);
            expect(taskInDb).toBeUndefined();
        });

        it('should throw 404 if task does not exist', async () => {
            await expect(
                deleteTask(testUserId, testProjectId, '999999')
            ).rejects.toThrow('Task not found');
        });

        it('should throw 400 if task belongs to a different project', async () => {
            // Try to delete a task from Project A using Project B's ID in the URL
            await expect(
                deleteTask(testUserId, '999', String(testTaskId))
            ).rejects.toThrow('Task does not belong to this project');
        });

        it('should reject if user is not a project member', async () => {
            const outsider = await UserModel.create({
                name: 'Outsider',
                email: `outsider_delete${Math.random()}@test.com`,
                passwordHash: 'fake'
            });

            await expect(
                deleteTask(String(outsider.id), testProjectId, String(testTaskId))
            ).rejects.toThrow('Access denied. You must be a project member to delete tasks.');
        });
    });


});
