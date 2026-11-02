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

describe('Joint Engineer Portal Test Suite', () => {
  let roadsDept = null;
  let waterDept = null;
  let engineer1Token = '';
  let engineer2Token = '';
  let engineer1 = null;
  let engineer2 = null;
  let citizen = null;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    roadsDept = await Department.create({ name: 'Roads & Potholes' });
    waterDept = await Department.create({ name: 'Water Supply' });

    const passwordHash = await User.hashPassword('Staff@SecurePass2026!');
    engineer1 = await User.create({
      name: 'Er. Suresh (Roads)',
      email: 'eng1.roads@civic.gov.in',
      staffId: 'ENG-0001',
      role: ROLES.ENGINEER,
      departmentId: roadsDept._id,
      maxActiveCases: 2, // low capacity for capacity testing
      passwordHash,
      isActive: true,
    });

    engineer2 = await User.create({
      name: 'Er. Ramesh (Roads)',
      email: 'eng2.roads@civic.gov.in',
      staffId: 'ENG-0002',
      role: ROLES.ENGINEER,
      departmentId: roadsDept._id,
      maxActiveCases: 5,
      passwordHash,
      isActive: true,
    });

    citizen = await User.create({
      name: 'Citizen 1',
      email: 'citizen1@test.com',
      passwordHash,
      role: ROLES.CITIZEN,
    });

    const l1 = await request(app).post('/api/v1/auth/staff/login').send({ identifier: 'ENG-0001', password: 'Staff@SecurePass2026!' });
    engineer1Token = l1.body.data.accessToken;

    const l2 = await request(app).post('/api/v1/auth/staff/login').send({ identifier: 'ENG-0002', password: 'Staff@SecurePass2026!' });
    engineer2Token = l2.body.data.accessToken;
  });

  it('should retrieve complaints in verification queue for engineer department', async () => {
    await Complaint.create({
      ticketNo: 'CMP-2026-000100',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Pothole needing verification',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Sector 5' },
      status: COMPLAINT_STATUS.VERIFICATION_NEEDED,
    });

    const res = await request(app)
      .get('/api/v1/engineer/queue')
      .set('Authorization', `Bearer ${engineer1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].ticketNo).toBe('CMP-2026-000100');
  });

  it('should atomically pick up complaint and prevent another engineer from taking it', async () => {
    const complaint = await Complaint.create({
      ticketNo: 'CMP-2026-000101',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Single complaint to test atomic pickup race condition',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Sector 6' },
      status: COMPLAINT_STATUS.VERIFICATION_NEEDED,
    });

    // Engineer 1 picks it up
    const res1 = await request(app)
      .post(`/api/v1/engineer/complaints/${complaint._id}/pickup`)
      .set('Authorization', `Bearer ${engineer1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);

    // Engineer 2 attempts to pick the same complaint
    const res2 = await request(app)
      .post(`/api/v1/engineer/complaints/${complaint._id}/pickup`)
      .set('Authorization', `Bearer ${engineer2Token}`);

    expect(res2.status).toBe(409); // CONFLICT
    expect(res2.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('should enforce active capacity limit and reject pickup when capacity reached (422)', async () => {
    // Engineer 1 max capacity is 2
    // Create 2 active cases already assigned to engineer 1
    await Complaint.create({
      ticketNo: 'CMP-2026-000201',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Active case 1',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Address 1' },
      status: COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
      assignedEngineerId: engineer1._id,
    });

    await Complaint.create({
      ticketNo: 'CMP-2026-000202',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Active case 2',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Address 2' },
      status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
      assignedEngineerId: engineer1._id,
    });

    // New case in queue
    const case3 = await Complaint.create({
      ticketNo: 'CMP-2026-000203',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Complaint case 3 with long description',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Address 3' },
      status: COMPLAINT_STATUS.VERIFICATION_NEEDED,
    });

    const res = await request(app)
      .post(`/api/v1/engineer/complaints/${case3._id}/pickup`)
      .set('Authorization', `Bearer ${engineer1Token}`);

    expect(res.status).toBe(422); // CAPACITY_REACHED
    expect(res.body.error.code).toBe('CAPACITY_REACHED');
  });

  it('should complete ground verification approval, start work, and complete work with photo', async () => {
    const complaint = await Complaint.create({
      ticketNo: 'CMP-2026-000300',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Ground verification full lifecycle',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Circle Chowk' },
      status: COMPLAINT_STATUS.VERIFICATION_NEEDED,
    });

    // 1. Pickup
    await request(app)
      .post(`/api/v1/engineer/complaints/${complaint._id}/pickup`)
      .set('Authorization', `Bearer ${engineer2Token}`);

    // 2. Approve Ground Verification
    const approveRes = await request(app)
      .post(`/api/v1/engineer/complaints/${complaint._id}/approve`)
      .set('Authorization', `Bearer ${engineer2Token}`)
      .send({ note: 'Inspected ground. Pothole measured 4ft wide.' });

    expect(approveRes.status).toBe(200);
    const approvedComp = await Complaint.findById(complaint._id);
    expect(approvedComp.status).toBe(COMPLAINT_STATUS.APPROVED);

    // 3. Start Work
    const startRes = await request(app)
      .post(`/api/v1/engineer/complaints/${complaint._id}/start`)
      .set('Authorization', `Bearer ${engineer2Token}`)
      .send({ note: 'Bitumen and asphalt crew started work' });

    expect(startRes.status).toBe(200);
    const wipComp = await Complaint.findById(complaint._id);
    expect(wipComp.status).toBe(COMPLAINT_STATUS.WORK_IN_PROGRESS);

    // 4. Complete Work
    const completeRes = await request(app)
      .post(`/api/v1/engineer/complaints/${complaint._id}/complete`)
      .set('Authorization', `Bearer ${engineer2Token}`)
      .field('completionNote', 'Pothole permanently resurfaced, leveled, and road opened for traffic.')
      .attach('image', samplePng);

    expect(completeRes.status).toBe(200);
    const completedComp = await Complaint.findById(complaint._id);
    expect(completedComp.status).toBe(COMPLAINT_STATUS.COMPLETED);
    expect(completedComp.completionNote).toContain('permanently resurfaced');
    expect(completedComp.completionImageUrl).toBeDefined();
  });

  it('should release case back to department queue with reason', async () => {
    const complaint = await Complaint.create({
      ticketNo: 'CMP-2026-000400',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Release case test',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Outer Bypass' },
      status: COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
      assignedEngineerId: engineer2._id,
    });

    const res = await request(app)
      .post(`/api/v1/engineer/complaints/${complaint._id}/release`)
      .set('Authorization', `Bearer ${engineer2Token}`)
      .send({ reason: 'Reassigned due to sudden field assignment in Ward 3' });

    expect(res.status).toBe(200);
    const releasedComp = await Complaint.findById(complaint._id);
    expect(releasedComp.status).toBe(COMPLAINT_STATUS.VERIFICATION_NEEDED);
    expect(releasedComp.assignedEngineerId).toBeNull();
  });
});
