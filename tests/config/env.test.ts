import { validateEnv, ENV } from '../../src/config/env';

describe('Environment Configuration', () => {
  const originalEnv = { ...ENV };

  afterEach(() => {
    Object.assign(ENV, originalEnv);
  });

  it('should throw an error if required variables are missing', () => {
    // @ts-ignore
    ENV.MONGO_URI = undefined;
    
    expect(() => validateEnv()).toThrow('Missing required environment variables: MONGO_URI');
  });

  it('should pass validation if all required variables are present', () => {
    ENV.MONGO_URI = 'mongodb://localhost:27017/syncforge';
    ENV.JWT_SECRET = 'secret';
    
    expect(() => validateEnv()).not.toThrow();
  });
});
