import { validateBody } from '../../src/middleware/validation.middleware';
import { Request, Response, NextFunction } from 'express';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should call next() if all required fields are present', () => {
    mockRequest.body = { username: 'test', password: 'password123' };
    const middleware = validateBody(['username', 'password']);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 400 Bad Request if fields are missing', () => {
    mockRequest.body = { username: 'test' };
    const middleware = validateBody(['username', 'password']);
    
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'ValidationError',
      message: 'Missing required fields: password'
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
