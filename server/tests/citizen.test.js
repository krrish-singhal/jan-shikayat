import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { User, Department, Complaint } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';
import { COMPLAINT_STATUS } from '../src/constants/complaintStatus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplePng = path.resolve(__dirname, 'fixtures/sample.png');

describe('Citizen Portal Test Suite', () => {
  let citizenToken = '';
  let citizenUser = null;
  let department = null;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    department = await Department.create({
      name: 'Roads & Potholes',
      description: 'Roads and potholes maintenance',
      isActive: true,
    });

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Aarav Citizen',
        email: 'aarav@citizen.local',
        password: 'Password@123!',
        phone: '+919988776655',
      });

    citizenToken = regRes.body.data.accessToken;
    citizenUser = regRes.body.data.user;
  });

  it('should fetch active departments list', async () => {
    const res = await request(app).get('/api/v1/departments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Roads & Potholes');
  });

  it('should register a new complaint with mandatory photo and location', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('departmentId', department._id.toString())
      .field('description', 'Dangerous deep pothole on main road causing accidents.')
      .field('address', 'MG Road near City Center')
      .field('latitude', '18.5204')
      .field('longitude', '73.8567')
      .attach('image', samplePng);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketNo).toMatch(/^CMP-\d{4}-\d{6}$/);
    expect(res.body.data.complaint.status).toBe(COMPLAINT_STATUS.SUBMITTED);
  });

  it('should reject complaint without photograph', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('departmentId', department._id.toString())
      .field('description', 'Valid description but missing photograph')
      .field('address', 'Some address');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('IMAGE_REQUIRED');
  });

  it('should reject complaint with description less than 10 characters', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('departmentId', department._id.toString())
      .field('description', 'Short')
      .field('address', 'Some address')
      .attach('image', samplePng);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_DESCRIPTION');
  });

  it('should list only citizen own complaints and map status to friendly label', async () => {
    // Create complaint for citizen 1
    await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('departmentId', department._id.toString())
      .field('description', 'Pothole on main lane 1')
      .field('address', 'Lane 1')
      .attach('image', samplePng);

    // Create another citizen
    const otherRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Other Citizen',
        email: 'other@citizen.local',
        password: 'Password@123!',
      });
    const otherToken = otherRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/complaints')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0); // Cannot see other citizen's complaints

    const ownRes = await request(app)
      .get('/api/v1/complaints')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(ownRes.status).toBe(200);
    expect(ownRes.body.data.items.length).toBe(1);
    expect(ownRes.body.data.items[0].status).toBe('Pending'); // Citizen display mapped!
  });

  it('should anonymize citizen account upon deletion without removing complaints', async () => {
    // Register complaint first
    const compRes = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('departmentId', department._id.toString())
      .field('description', 'Pothole complaint before account deletion')
      .field('address', 'Civil Lines')
      .attach('image', samplePng);

    const ticketNo = compRes.body.data.ticketNo;

    // Delete account
    const delRes = await request(app)
      .delete('/api/v1/me')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Complaint record must still exist
    const complaint = await Complaint.findOne({ ticketNo });
    expect(complaint).toBeDefined();

    // User record must be anonymized
    const anonymizedUser = await User.findById(citizenUser._id);
    expect(anonymizedUser.name).toBe('Anonymized Citizen');
    expect(anonymizedUser.email).toContain('@anonymized.local');
    expect(anonymizedUser.isDeleted).toBe(true);
  });
});
