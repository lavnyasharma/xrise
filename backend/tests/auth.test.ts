import { clearDB, startTestDB, stopTestDB } from './setup';
import request from 'supertest';
import { buildApp } from '../src/app';
import { seedUser } from './helpers';

const app = buildApp();

beforeAll(async () => {
  await startTestDB();
});

afterAll(async () => {
  await stopTestDB();
});

beforeEach(async () => {
  await clearDB();
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    await seedUser('admin@test.com', 'admin', 'Admin@12345');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@12345' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: 'admin@test.com', role: 'admin' });
  });

  it('rejects an invalid password', async () => {
    await seedUser('agent@test.com', 'agent', 'Agent@12345');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/invalid credentials/i);
  });

  it('rejects malformed input', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/validation/i);
  });
});
