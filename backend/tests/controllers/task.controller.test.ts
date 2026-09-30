import { Request, Response, NextFunction } from 'express';
import { createTaskController, getTasksController, getTaskByIdController, updateTaskController, deleteTaskController } from '../../src/controllers/task.controller';
import * as TaskService from '../../src/services/task.service';

// 1. Mock the Service Layer
// We don't want to actually connect to the database or run business logic here.
// We just want to test if the Controller properly passes data TO the service.
jest.mock('../../src/services/task.service');

describe('Task Controller', () => {
    // 2. Setup Mock Express Objects
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;
    const mockUserId = 'user-123';

    beforeEach(() => {
        // Reset our fake Express Request object before each test
        mockReq = {
            user: { userId: mockUserId } as any, // Simulates a logged-in user
            params: {},                          // Simulates URL params like /:projectId
            body: {},                            // Simulates JSON body payload
            query: {}                            // Simulates query string params like ?page=1
        };

        // Reset our fake Express Response object
        mockRes = {
            // .status() returns `this` so we can chain .json() like: res.status(200).json(...)
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Reset our fake next() function used for error handling
        mockNext = jest.fn();

        // Clear any previous mock calls to ensure a clean slate
        jest.clearAllMocks();
    });

    describe('createTaskController', () => {
        beforeEach(() => {
            // Simulate the URL being /projects/100/tasks
            mockReq.params = { projectId: '100' };
        });

        it('should call service and return 201 on success', async () => {
            // Simulate the user sending { title: 'New Task', priority: 'High' }
            mockReq.body = { title: 'New Task', priority: 'High' };

            // Define what the fake Service should return when called
            const mockTask = { id: 1, projectId: 100, title: 'New Task', priority: 'High', status: 'Todo' };

            // Tell Jest: "When the controller calls createTask(), immediately return mockTask"
            (TaskService.createTask as jest.Mock).mockResolvedValue(mockTask);

            // Execute the Controller
            await createTaskController(mockReq as Request, mockRes as Response, mockNext);

            // ASSERTIONS: Verify the controller did its job correctly

            // 1. Did it pass the exact right data to the Service?
            expect(TaskService.createTask).toHaveBeenCalledWith(mockUserId, '100', {
                title: 'New Task',
                description: undefined, // undefined because we didn't provide it in req.body
                priority: 'High',
                labels: undefined,
                dueDate: undefined
            });

            // 2. Did it respond with the correct HTTP status code?
            expect(mockRes.status).toHaveBeenCalledWith(201);

            // 3. Did it send the mockTask back to the user as JSON?
            expect(mockRes.json).toHaveBeenCalledWith(mockTask);
        });

        it('should pass errors to next()', async () => {
            // Simulate the user sending a request
            mockReq.body = { title: 'Fail Task' };

            // Simulate the Service throwing an error (e.g., "Not a project member")
            const error = new Error('Not a project member');
            (TaskService.createTask as jest.Mock).mockRejectedValue(error);

            // Execute the Controller
            await createTaskController(mockReq as Request, mockRes as Response, mockNext);

            // Verify that the Controller caught the error and passed it to Express's error handler
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });


    describe('getTasksController', () => {
        it('should return 200 with paginated result', async () => {
            mockReq.params = { projectId: '100' };
            mockReq.query = {};
            const mockResult = {
                data: [{ id: 1, title: 'Task A' }, { id: 2, title: 'Task B' }],
                pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
            };

            (TaskService.getTasks as jest.Mock).mockResolvedValue(mockResult);

            await getTasksController(mockReq as Request, mockRes as Response, mockNext);

            expect(TaskService.getTasks).toHaveBeenCalledWith(mockUserId, '100', {}, { page: 1, limit: 20 });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockResult);
        });

        it('should pass filters and pagination from query string', async () => {
            mockReq.params = { projectId: '100' };
            mockReq.query = { status: 'Done', search: 'bug', page: '2', limit: '5' };
            const mockResult = {
                data: [{ id: 3, title: 'Bug Fix' }],
                pagination: { page: 2, limit: 5, total: 6, totalPages: 2 },
            };

            (TaskService.getTasks as jest.Mock).mockResolvedValue(mockResult);

            await getTasksController(mockReq as Request, mockRes as Response, mockNext);

            expect(TaskService.getTasks).toHaveBeenCalledWith(
                mockUserId, '100',
                { status: 'Done', search: 'bug' },
                { page: 2, limit: 5 }
            );
        });

        it('should pass errors to next()', async () => {
            mockReq.params = { projectId: '100' };
            mockReq.query = {};
            const error = new Error('Not a member');
            (TaskService.getTasks as jest.Mock).mockRejectedValue(error);

            await getTasksController(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getTaskByIdController', () => {
        it('should return 200 with a single task', async () => {
            mockReq.params = { projectId: '100', taskId: '5' };
            const mockTask = { id: 5, title: 'Single Task' };

            (TaskService.getTaskById as jest.Mock).mockResolvedValue(mockTask);

            await getTaskByIdController(mockReq as Request, mockRes as Response, mockNext);

            expect(TaskService.getTaskById).toHaveBeenCalledWith(mockUserId, '100', '5');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockTask);
        });

        it('should pass errors to next()', async () => {
            mockReq.params = { projectId: '100', taskId: '999' };
            const error = new Error('Task not found');
            (TaskService.getTaskById as jest.Mock).mockRejectedValue(error);

            await getTaskByIdController(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });


    describe('updateTaskController', () => {
        it('should call service and return 200 on success', async () => {
            mockReq.params = { projectId: '100', taskId: '5' };
            mockReq.body = { title: 'New Title', priority: 'Urgent' };

            const mockTask = { id: 5, title: 'New Title', priority: 'Urgent' };
            (TaskService.updateTask as jest.Mock).mockResolvedValue(mockTask);

            await updateTaskController(mockReq as Request, mockRes as Response, mockNext);

            expect(TaskService.updateTask).toHaveBeenCalledWith(mockUserId, '100', '5', {
                title: 'New Title',
                description: undefined,
                priority: 'Urgent',
                status: undefined,
                labels: undefined,
                dueDate: undefined,
                assigneeId: undefined
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockTask);
        });

        it('should pass errors to next()', async () => {
            mockReq.params = { projectId: '100', taskId: '5' };
            mockReq.body = { title: 'Fail Task' };

            const error = new Error('Access denied');
            (TaskService.updateTask as jest.Mock).mockRejectedValue(error);

            await updateTaskController(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });

        it('should extract assigneeId and pass it to the service', async () => {
            mockReq.params = { projectId: '100', taskId: '5' };
            mockReq.body = { assigneeId: '99' };
            
            const mockTask = { id: 5, assigneeId: 99 };
            (TaskService.updateTask as jest.Mock).mockResolvedValue(mockTask);

            await updateTaskController(mockReq as Request, mockRes as Response, mockNext);

            expect(TaskService.updateTask).toHaveBeenCalledWith(mockUserId, '100', '5', {
                title: undefined,
                description: undefined,
                priority: undefined,
                status: undefined,
                labels: undefined,
                dueDate: undefined,
                assigneeId: '99'
            });
            expect(mockRes.json).toHaveBeenCalledWith(mockTask);
        });

        it('should extract status and pass it to the service', async () => {
            mockReq.params = { projectId: '100', taskId: '5' };
            mockReq.body = { status: 'In Progress' };
            
            const mockTask = { id: 5, status: 'In Progress' };
            (TaskService.updateTask as jest.Mock).mockResolvedValue(mockTask);

            await updateTaskController(mockReq as Request, mockRes as Response, mockNext);

            expect(TaskService.updateTask).toHaveBeenCalledWith(mockUserId, '100', '5', {
                title: undefined,
                description: undefined,
                priority: undefined,
                status: 'In Progress',
                labels: undefined,
                dueDate: undefined,
                assigneeId: undefined
            });
            expect(mockRes.json).toHaveBeenCalledWith(mockTask);
        });
    });

        describe('deleteTaskController', () => {
        it('should call service and return 200 on success', async () => {
            mockReq.params = { projectId: '100', taskId: '5' };
            
            // Tell our mock service to pretend it succeeded
            (TaskService.deleteTask as jest.Mock).mockResolvedValue(undefined);

            await deleteTaskController(mockReq as Request, mockRes as Response, mockNext);

            expect(TaskService.deleteTask).toHaveBeenCalledWith(mockUserId, '100', '5');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Task deleted successfully' });
        });

        it('should pass errors to next()', async () => {
            mockReq.params = { projectId: '100', taskId: '5' };
            
            const error = new Error('Task not found');
            (TaskService.deleteTask as jest.Mock).mockRejectedValue(error);

            await deleteTaskController(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });



});
