import { errorHandler, notFoundHandler } from '../../src/middleware/error.middleware';
import { Request, Response, NextFunction } from 'express';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle generic errors and return 500 status', () => {
      const error = new Error('Test generic error');
      
      errorHandler(error as any, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error',
        message: 'Test generic error'
      });
    });

    it('should map specific error status codes (e.g. 400)', () => {
      const error: any = new Error('Bad request missing fields');
      error.statusCode = 400;
      error.name = 'ValidationError';
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ValidationError',
        message: 'Bad request missing fields'
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should return a 404 response', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'NotFound',
        message: 'The requested resource was not found'
      });
    });
  });
});
