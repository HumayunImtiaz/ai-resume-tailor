import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Module mocks (hoisted before any imports of the real modules) ────────────

// Prevent env.ts from throwing on missing env vars
vi.mock('../../config/env', () => ({
  default: {
    port: 4000,
    nodeEnv: 'test',
    databaseUrl: 'postgresql://test',
    jwtSecret: 'test-secret',
    jwtExpiresIn: '7d',
    redis: { host: 'localhost', port: 6379 },
    groqApiKey: 'test-groq-key',
  },
  env: {
    port: 4000,
    nodeEnv: 'test',
    databaseUrl: 'postgresql://test',
    jwtSecret: 'test-secret',
    jwtExpiresIn: '7d',
    redis: { host: 'localhost', port: 6379 },
    groqApiKey: 'test-groq-key',
  },
}));

// Mock the Prisma client — no real DB connections
vi.mock('../../config/database', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs so tests are fast and deterministic
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken so tests never depend on real crypto
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}));

// ─── Imports (after vi.mock calls) ───────────────────────────────────────────
import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '../auth.service';

// Typed references to the mocked functions for IDE autocomplete
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockCreate     = vi.mocked(prisma.user.create);
const mockHash       = vi.mocked(bcrypt.hash);
const mockCompare    = vi.mocked(bcrypt.compare);
const mockSign       = vi.mocked(jwt.sign);

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const SIGNUP_INPUT = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'securepassword123',
};

const LOGIN_INPUT = {
  email: 'jane@example.com',
  password: 'securepassword123',
};

/** A DB row as returned by prisma.user.findUnique (includes passwordHash) */
const DB_USER = {
  id: 'user-001',
  name: 'Jane Doe',
  email: 'jane@example.com',
  passwordHash: 'hashed-pw',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

/** Shape returned by prisma.user.create with its select clause (no passwordHash) */
const CREATED_USER = {
  id: 'user-001',
  name: 'Jane Doe',
  email: 'jane@example.com',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
};

const FAKE_TOKEN = 'fake.jwt.token';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authService.signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { success: false, error: "Email already registered" } when user already exists', async () => {
    mockFindUnique.mockResolvedValueOnce(DB_USER as any);

    const result = await authService.signup(SIGNUP_INPUT);

    expect(result.success).toBe(false);
    expect((result as any).error).toBe('Email already registered');

    // Should not attempt to create or hash anything
    expect(mockHash).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns { success: true, data: { token, user } } and omits passwordHash on successful signup', async () => {
    mockFindUnique.mockResolvedValueOnce(null);           // no existing user
    mockHash.mockResolvedValueOnce('hashed-pw' as any);   // bcrypt.hash result
    mockCreate.mockResolvedValueOnce(CREATED_USER as any);
    mockSign.mockReturnValueOnce(FAKE_TOKEN as any);

    const result = await authService.signup(SIGNUP_INPUT);

    expect(result.success).toBe(true);

    if (!result.success) throw new Error('Expected success');

    expect(result.data.token).toBe(FAKE_TOKEN);
    expect(result.data.user).toEqual(CREATED_USER);

    // The returned user object must NOT contain passwordHash
    expect(result.data.user).not.toHaveProperty('passwordHash');

    // bcrypt.hash should have been called with the raw password
    expect(mockHash).toHaveBeenCalledWith(SIGNUP_INPUT.password, 10);

    // jwt.sign should have been called with the new user's ID
    expect(mockSign).toHaveBeenCalledWith(
      { userId: CREATED_USER.id },
      'test-secret',
      expect.objectContaining({ expiresIn: '7d' })
    );
  });

  it('returns { success: false } if an unexpected internal error is thrown', async () => {
    mockFindUnique.mockRejectedValueOnce(new Error('DB connection lost'));

    const result = await authService.signup(SIGNUP_INPUT);

    expect(result.success).toBe(false);
    // Should surface a safe, generic message — not the raw DB error
    expect((result as any).error).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { success: false, error: "Invalid email or password" } when no user is found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await authService.login(LOGIN_INPUT);

    expect(result.success).toBe(false);
    expect((result as any).error).toBe('Invalid email or password');

    // Password comparison must never run — avoids leaking timing info
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it('returns the same generic error "Invalid email or password" when password does not match (security: no user-enumeration leakage)', async () => {
    mockFindUnique.mockResolvedValueOnce(DB_USER as any);
    mockCompare.mockResolvedValueOnce(false as any); // wrong password

    const result = await authService.login(LOGIN_INPUT);

    expect(result.success).toBe(false);

    // Explicitly assert the message is identical to the not-found case —
    // this is the security property we want to lock in.
    expect((result as any).error).toBe('Invalid email or password');
  });

  it('returns { success: true, data: { token, user } } on successful login', async () => {
    mockFindUnique.mockResolvedValueOnce(DB_USER as any);
    mockCompare.mockResolvedValueOnce(true as any); // correct password
    mockSign.mockReturnValueOnce(FAKE_TOKEN as any);

    const result = await authService.login(LOGIN_INPUT);

    expect(result.success).toBe(true);

    if (!result.success) throw new Error('Expected success');

    expect(result.data.token).toBe(FAKE_TOKEN);

    // User shape should match what the service manually picks
    expect(result.data.user).toEqual({
      id: DB_USER.id,
      name: DB_USER.name,
      email: DB_USER.email,
      createdAt: DB_USER.createdAt,
    });

    // passwordHash must not be exposed via login either
    expect(result.data.user).not.toHaveProperty('passwordHash');

    // jwt.sign called with correct payload
    expect(mockSign).toHaveBeenCalledWith(
      { userId: DB_USER.id },
      'test-secret',
      expect.objectContaining({ expiresIn: '7d' })
    );
  });
});
