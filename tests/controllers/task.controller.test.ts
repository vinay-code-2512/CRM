import { Request, Response, NextFunction } from 'express';
import { createTaskController } from '../../src/controllers/task.controller';
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
            body: {}                             // Simulates JSON body payload
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
});
