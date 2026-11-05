const request = require('supertest');
const app = require('../app');

describe('Application Core & Endpoints', () => {
  test('GET /health should return 200 and operational system status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment');
  });

  test('GET / should redirect unauthenticated visitor to /auth/login', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /auth/login should render luxury portal sign-in page with 200 status', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Grand Royale');
    expect(res.text).toContain('Sign In to Portal');
  });

  test('GET /dashboard should block unauthenticated request and redirect to /auth/login', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /rooms should block unauthenticated request and redirect to /auth/login', async () => {
    const res = await request(app).get('/rooms');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /bookings should block unauthenticated request and redirect to /auth/login', async () => {
    const res = await request(app).get('/bookings');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /guests should block unauthenticated request and redirect to /auth/login', async () => {
    const res = await request(app).get('/guests');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /payments should block unauthenticated request and redirect to /auth/login', async () => {
    const res = await request(app).get('/payments');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /staff should block unauthenticated request and redirect to /auth/login', async () => {
    const res = await request(app).get('/staff');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /non-existent-route should trigger 404 handler', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.statusCode).toBe(404);
    expect(res.text).toContain('404');
  });
});

