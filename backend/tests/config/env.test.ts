import { validateEnv, ENV } from '../../src/config/env';

describe('Environment Configuration', () => {
  const originalEnv = { ...ENV };

  afterEach(() => {
    Object.assign(ENV, originalEnv);
  });

  it('should throw an error if required variables are missing', () => {
    // @ts-ignore
    ENV.JWT_SECRET = undefined;
    
    expect(() => validateEnv()).toThrow('Missing required environment variables: JWT_SECRET');
  });

  it('should pass validation if all required variables are present', () => {
    ENV.JWT_SECRET = 'secret';
    
    expect(() => validateEnv()).not.toThrow();
  });
});
