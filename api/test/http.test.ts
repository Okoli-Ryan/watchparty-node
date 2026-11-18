import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { issueToken } from '../src/http/auth.ts';

// The HTTP pipeline end to end, minus the database: every request here is
// answered before any query runs.

const app = createApp();
const token = issueToken({ id: '0b5e3c1a-1f2d-4e5f-8a9b-0c1d2e3f4a5b', displayName: 'Tester', role: 'user' }).token;

describe('the HTTP pipeline', () => {
  it('reports liveness without touching the database', async () => {
    const response = await request(app).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Healthy');
  });

  it('refuses a request without a token, as Problem Details', async () => {
    const response = await request(app).get('/api/v1/rooms');
    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body).toMatchObject({ status: 401, code: 'Auth.Unauthorized' });
  });

  it('refuses a forged token', async () => {
    const response = await request(app).get('/api/v1/me').set('Authorization', 'Bearer not.a.token');
    expect(response.status).toBe(401);
  });

  it('names every invalid field when sign-up input is wrong', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', displayName: '  ', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('Validation.Failed');
    expect(Object.keys(response.body.errors).sort()).toEqual(['displayName', 'email', 'password']);
    expect(response.body.errors.password).toEqual(['Passwords are 8 to 72 characters.']);
  });

  it('rejects a body that is not JSON', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('Request.Malformed');
  });

  it('validates a host action before touching the room', async () => {
    const response = await request(app)
      .put('/api/v1/rooms/0b5e3c1a-1f2d-4e5f-8a9b-0c1d2e3f4a5b/playback')
      .set('Authorization', `Bearer ${token}`)
      .send({ isPlaying: true, currentTime: 5, rate: 99 });
    expect(response.status).toBe(400);
    expect(response.body.errors.rate).toEqual(['Playback rate must be between 0.0625 and 16.']);
  });

  it('answers an unknown route or a malformed room id with 404', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    expect((await request(app).get('/api/v1/nowhere').set(auth)).status).toBe(404);
    expect((await request(app).get('/api/v1/rooms/not-a-uuid').set(auth)).status).toBe(404);
  });

  it('sends security headers', async () => {
    const response = await request(app).get('/health/live');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
  });
});
