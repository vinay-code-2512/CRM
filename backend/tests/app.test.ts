import request from 'supertest';
import app from '../src/app';

describe('App Integration', () => {
  it('should return 404 for undefined routes', async () => {
    const response = await request(app).get('/api/v1/some-unknown-route');
    
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'NotFound',
      message: 'The requested resource was not found'
    });
  });

  it('should include security headers from Helmet', async () => {
    const response = await request(app).get('/api/v1/some-unknown-route');
    
    // Check for some common helmet headers
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['content-security-policy']).toBeDefined();
  });
});
