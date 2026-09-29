import db from '../../src/lib/prisma';
import { UserModel } from '../../src/models/UserPrisma';
import { WorkspaceModel } from '../../src/models/WorkspacePrisma';
import { ProjectModel } from '../../src/models/ProjectPrisma';
import { ProjectMemberModel } from '../../src/models/ProjectMemberPrisma';
import { TaskModel } from '../../src/models/TaskPrisma';
import { CommentModel } from '../../src/models/CommentPrisma';
import { createComment, getComments, updateComment, deleteComment } from '../../src/services/comment.service';

describe('Comment Service', () => {
    let testUserId: string;
    let otherUserId: string;
    let testProjectId: number;
    let testTaskId: string;

    beforeAll(async () => {
        await db.connect();
    });

    beforeEach(async () => {
        // 1. Setup Users
        const user1 = await UserModel.create({ name: 'Commenter', email: `c1-${Date.now()}@test.com`, passwordHash: 'hash' });
        const user2 = await UserModel.create({ name: 'Stranger', email: `c2-${Date.now()}@test.com`, passwordHash: 'hash' });
        testUserId = String(user1.id);
        otherUserId = String(user2.id);

        // 2. Setup Workspace & Project
        const ws = await WorkspaceModel.create({ name: 'Test WS' });
        const proj = await ProjectModel.create({ workspaceId: ws.id, name: 'Test Proj' });
        testProjectId = proj.id;

        // 3. Add user1 to Project
        await ProjectMemberModel.create({ projectId: proj.id, userId: user1.id });

        // 4. Setup Task
        const task = await TaskModel.create({ projectId: proj.id, title: 'Comment Task' });
        testTaskId = String(task.id);
    });

    afterEach(async () => {
        await (db.orm as any).public.Comment.deleteAll();
        await (db.orm as any).public.Task.deleteAll();
        await (db.orm as any).public.ProjectMember.deleteAll();
        await (db.orm as any).public.Project.deleteAll();
        await (db.orm as any).public.Workspace.deleteAll();
        await (db.orm as any).public.User.deleteAll();
    });

    afterAll(async () => {
        await db.close();
    });

    describe('createComment', () => {
        it('should allow project members to comment', async () => {
            const comment = await createComment(testUserId, testTaskId, 'Hello world');
            expect(comment.content).toBe('Hello world');
            expect(comment.taskId).toBe(Number(testTaskId));
        });

        it('should block non-members from commenting', async () => {
            await expect(createComment(otherUserId, testTaskId, 'Hacker comment'))
                .rejects.toMatchObject({ statusCode: 403 });
        });
    });

    describe('getComments', () => {
        it('should retrieve comments in order', async () => {
            await createComment(testUserId, testTaskId, 'First');
            await createComment(testUserId, testTaskId, 'Second');
            
            const comments = await getComments(testUserId, testTaskId);
            expect(comments.length).toBe(2);
            expect(comments[0].content).toBe('First');
        });
    });

    describe('updateComment', () => {
        it('should let author edit comment', async () => {
            const comment = await createComment(testUserId, testTaskId, 'Original');
            const updated = await updateComment(testUserId, String(comment.id), 'Edited');
            expect(updated.content).toBe('Edited');
        });

        it('should block others from editing', async () => {
            const comment = await createComment(testUserId, testTaskId, 'Original');
            await expect(updateComment(otherUserId, String(comment.id), 'Hack'))
                .rejects.toMatchObject({ statusCode: 403 });
        });
    });

    describe('deleteComment', () => {
        it('should let author delete comment', async () => {
            const comment = await createComment(testUserId, testTaskId, 'To delete');
            await deleteComment(testUserId, String(comment.id));
            const comments = await getComments(testUserId, testTaskId);
            expect(comments.length).toBe(0);
        });
    });
});
