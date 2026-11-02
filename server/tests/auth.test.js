import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { User, Department, Counter } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';

describe('Authentication & Authorization Suite', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  it('should register a new citizen with valid details', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'John Citizen',
        email: 'john.citizen@example.com',
        password: 'Password@123!',
        phone: '+919876543210',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('john.citizen@example.com');
    expect(res.body.data.user.role).toBe(ROLES.CITIZEN);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject registration with duplicate email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'John Citizen',
        email: 'john.citizen@example.com',
        password: 'Password@123!',
      });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Another User',
        email: 'john.citizen@example.com',
        password: 'Password@123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('should reject registration with weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Weak Pass',
        email: 'weak@example.com',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should login citizen with valid credentials', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Citizen Login',
        email: 'citizen.login@example.com',
        password: 'Password@123!',
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'citizen.login@example.com',
        password: 'Password@123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Citizen Wrong',
        email: 'citizen.wrong@example.com',
        password: 'Password@123!',
      });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'citizen.wrong@example.com',
        password: 'WrongPassword@123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should authenticate staff with Staff ID (e.g. OP-0001)', async () => {
    const dept = await Department.create({ name: 'Roads & Potholes' });
    const passwordHash = await User.hashPassword('Staff@Secure123!');
    await User.create({
      name: 'Operator 1',
      email: 'operator1@civic.gov.in',
      staffId: 'OP-0001',
      role: ROLES.OPERATOR,
      departmentId: dept._id,
      passwordHash,
      isActive: true,
    });

    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({
        identifier: 'OP-0001',
        password: 'Staff@Secure123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.staffId).toBe('OP-0001');
    expect(res.body.data.user.role).toBe(ROLES.OPERATOR);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject deactivated staff login', async () => {
    const dept = await Department.create({ name: 'Sanitation' });
    const passwordHash = await User.hashPassword('Staff@Secure123!');
    await User.create({
      name: 'Deactivated Op',
      email: 'deact@civic.gov.in',
      staffId: 'OP-0009',
      role: ROLES.OPERATOR,
      departmentId: dept._id,
      passwordHash,
      isActive: false,
    });

    const res = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({
        identifier: 'OP-0009',
        password: 'Staff@Secure123!',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_DEACTIVATED');
  });

  it('should rotate refresh token and revoke previous tokens', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Refresh Test',
        email: 'refresh@example.com',
        password: 'Password@123!',
      });

    const cookie = regRes.headers['set-cookie'];
    expect(cookie).toBeDefined();

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    const newCookie = refreshRes.headers['set-cookie'];
    expect(newCookie).toBeDefined();

    // Trying to use old cookie again should fail due to rotation revocation
    const replayRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie);

    expect(replayRes.status).toBe(403);
    expect(replayRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');
  });

  it('should successfully logout and clear cookies', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Logout Test',
        email: 'logout@example.com',
        password: 'Password@123!',
      });

    const cookie = regRes.headers['set-cookie'];
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });
});
