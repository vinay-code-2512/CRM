import { Request, Response, NextFunction } from 'express';
import { createProjectController, getProjectsController, updateProjectController } from '../../src/controllers/project.controller';
import * as ProjectService from '../../src/services/project.service';

// mock project service to test controller only 
jest.mock('../../src/services/project.service');

describe('Project Controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    const mockUserId = '123';
    const mockWorkspaceId = '456';

    beforeEach(() => {
        mockReq = {
            user: { userId: mockUserId },
            params: { id: mockWorkspaceId },
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('createProjectController', () => {
        it('should call service and return 201 on success', async () => {
            mockReq.body = { name: 'New Project', description: 'Test Desc' };
            const mockProject = { id: 1, name: 'New Project' };
            (ProjectService.createProject as jest.Mock).mockResolvedValue(mockProject);

            await createProjectController(mockReq as Request, mockRes as Response, mockNext);

            expect(ProjectService.createProject).toHaveBeenCalledWith(mockUserId, mockWorkspaceId, {
                name: 'New Project',
                description: 'Test Desc'
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(mockProject);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass errors to next()', async () => {
            const error = new Error('Service Error');
            (ProjectService.createProject as jest.Mock).mockRejectedValue(error);

            await createProjectController(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getProjectsController', () => {
        it('should call service and return 200 on success', async () => {
            const mockProjects = [{ id: 1, name: 'Project A' }];
            (ProjectService.getProjects as jest.Mock).mockResolvedValue(mockProjects);

            await getProjectsController(mockReq as Request, mockRes as Response, mockNext);

            expect(ProjectService.getProjects).toHaveBeenCalledWith(mockUserId, mockWorkspaceId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockProjects);
        });

        it('should pass errors to next()', async () => {
            const error = new Error('Service Error');
            (ProjectService.getProjects as jest.Mock).mockRejectedValue(error);

            await getProjectsController(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('updateProjectController', () => {
        beforeEach(() => {
            mockReq.params = { projectId: '789' };
        });

        it('should call service and return 200 on success', async () => {
            mockReq.body = { name: 'Updated Name', isArchived: true };
            const mockUpdatedProject = { id: 789, name: 'Updated Name', isArchived: true };

            (ProjectService.updateProject as jest.Mock).mockResolvedValue(mockUpdatedProject);

            await updateProjectController(mockReq as Request, mockRes as Response, mockNext);

            expect(ProjectService.updateProject).toHaveBeenCalledWith(mockUserId, '789', {
                name: 'Updated Name',
                description: undefined,
                isArchived: true
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedProject);
        });

        it('should pass errors to next()', async () => {
            const error = new Error('Not found');
            (ProjectService.updateProject as jest.Mock).mockRejectedValue(error);

            await updateProjectController(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

});
