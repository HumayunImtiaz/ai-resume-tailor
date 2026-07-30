/**
 * Integration tests — auth routes
 *
 * These tests exercise the full HTTP stack (Express → controller → service → Prisma → Postgres).
 * They require the Docker Compose database to be running with DATABASE_URL set in .env.
 *
 * Test data is namespaced with the "test-integration-" email prefix and is
 * cleaned up in beforeEach / afterAll so it never leaks into real data.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database';

// ─── Namespace ────────────────────────────────────────────────────────────────

const TEST_EMAIL_PREFIX = 'test-integration-';

/** Clean every user whose email starts with our test prefix. */
async function cleanTestUsers() {
  await prisma.user.deleteMany({
    where: { email: { startsWith: TEST_EMAIL_PREFIX } },
  });
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_USER = {
  name: 'Integration Tester',
  email: `${TEST_EMAIL_PREFIX}auth@example.com`,
  password: 'StrongPass123!',
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

// Wipe before the suite starts — guards against a previous failed run
beforeAll(async () => {
  await cleanTestUsers();
});

// Wipe before each test so each one starts with a blank slate
beforeEach(async () => {
  await cleanTestUsers();
});

// Final cleanup after all tests complete (including on failure)
afterAll(async () => {
  await cleanTestUsers();
  await prisma.$disconnect();
});

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  it('returns 201 and a JWT token when given valid data', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(VALID_USER)
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.statusCode).toBe(201);

    // Token must be present and look like a JWT (three dot-separated segments)
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.split('.').length).toBe(3);

    // User object is returned without the password hash
    expect(res.body.data.user).toMatchObject({
      name: VALID_USER.name,
      email: VALID_USER.email,
    });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('returns 409 when the same email is signed up twice', async () => {
    // First signup
    await request(app).post('/api/auth/signup').send(VALID_USER).expect(201);

    // Second signup with the same email
    const res = await request(app)
      .post('/api/auth/signup')
      .send(VALID_USER)
      .expect(409);

    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('returns 400 when the password is too short (< 8 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Bad User',
        email: `${TEST_EMAIL_PREFIX}badpass@example.com`,
        password: 'short',        // fails Zod min(8) rule
      })
      .expect(400);

    expect(res.body.status).toBe('error');
    expect(res.body.statusCode).toBe(400);
  });

  it('returns 400 when a required field (email) is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'No Email', password: 'StrongPass123!' })
      .expect(400);

    expect(res.body.status).toBe('error');
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  // Create the test user once before every login test
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(VALID_USER).expect(201);
  });

  it('returns 200 and a JWT token with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: VALID_USER.password })
      .expect(200);

    expect(res.body.status).toBe('success');

    // Token must be a valid JWT string
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.split('.').length).toBe(3);

    // User data is returned
    expect(res.body.data.user).toMatchObject({
      email: VALID_USER.email,
      name: VALID_USER.name,
    });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 with a generic message when the password is wrong', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: 'WrongPassword!' })
      .expect(401);

    expect(res.body.status).toBe('error');
    // Must NOT hint whether the email or password was wrong (security)
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 401 with the same generic message when the email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: `${TEST_EMAIL_PREFIX}nobody@example.com`,
        password: 'DoesNotMatter1!',
      })
      .expect(401);

    expect(res.body.status).toBe('error');
    // Identical message to wrong-password — no user enumeration leak
    expect(res.body.message).toBe('Invalid email or password');
  });
});
