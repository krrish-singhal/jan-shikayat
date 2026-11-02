import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { User, Department, Complaint } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';
import { COMPLAINT_STATUS } from '../src/constants/complaintStatus.js';

describe('Operator Portal Test Suite', () => {
  let roadsDept = null;
  let waterDept = null;
  let roadsOperatorToken = '';
  let roadsOperator = null;
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
    roadsOperator = await User.create({
      name: 'Roads Operator',
      email: 'op.roads@civic.gov.in',
      staffId: 'OP-0001',
      role: ROLES.OPERATOR,
      departmentId: roadsDept._id,
      passwordHash,
      isActive: true,
    });

    citizen = await User.create({
      name: 'Citizen 1',
      email: 'citizen1@test.com',
      passwordHash,
      role: ROLES.CITIZEN,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ identifier: 'OP-0001', password: 'Staff@SecurePass2026!' });
    roadsOperatorToken = loginRes.body.data.accessToken;
  });

  it('should enforce department isolation on incoming queue', async () => {
    // Complaint for Roads
    await Complaint.create({
      ticketNo: 'CMP-2026-000001',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Road pothole problem',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Road 1' },
      status: COMPLAINT_STATUS.SUBMITTED,
    });

    // Complaint for Water
    await Complaint.create({
      ticketNo: 'CMP-2026-000002',
      citizenId: citizen._id,
      departmentId: waterDept._id,
      description: 'Water leak problem',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Road 2' },
      status: COMPLAINT_STATUS.SUBMITTED,
    });

    const res = await request(app)
      .get('/api/v1/operator/complaints')
      .set('Authorization', `Bearer ${roadsOperatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].ticketNo).toBe('CMP-2026-000001');
  });

  it('should accept complaint and move to VERIFICATION_NEEDED', async () => {
    const complaint = await Complaint.create({
      ticketNo: 'CMP-2026-000010',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Major road break near metro station',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Metro Station Gate 2' },
      status: COMPLAINT_STATUS.SUBMITTED,
    });

    const res = await request(app)
      .post(`/api/v1/operator/complaints/${complaint._id}/accept`)
      .set('Authorization', `Bearer ${roadsOperatorToken}`)
      .send({ note: 'Verified genuine complaint' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await Complaint.findById(complaint._id);
    expect(updated.status).toBe(COMPLAINT_STATUS.VERIFICATION_NEEDED);
  });

  it('should reject complaint with mandatory rejection reason', async () => {
    const complaint = await Complaint.create({
      ticketNo: 'CMP-2026-000020',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Duplicate road issue',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Lane 4' },
      status: COMPLAINT_STATUS.SUBMITTED,
    });

    // Rejection without reason fails
    const failRes = await request(app)
      .post(`/api/v1/operator/complaints/${complaint._id}/reject`)
      .set('Authorization', `Bearer ${roadsOperatorToken}`)
      .send({ rejectionReason: '' });

    expect(failRes.status).toBe(400);

    // Valid rejection
    const successRes = await request(app)
      .post(`/api/v1/operator/complaints/${complaint._id}/reject`)
      .set('Authorization', `Bearer ${roadsOperatorToken}`)
      .send({ rejectionReason: 'Duplicate complaint of ticket CMP-2026-000019' });

    expect(successRes.status).toBe(200);
    const updated = await Complaint.findById(complaint._id);
    expect(updated.status).toBe(COMPLAINT_STATUS.REJECTED);
    expect(updated.rejectionReason).toContain('Duplicate complaint');
  });

  it('should forward complaint to another department and remove from current queue', async () => {
    const complaint = await Complaint.create({
      ticketNo: 'CMP-2026-000030',
      citizenId: citizen._id,
      departmentId: roadsDept._id,
      description: 'Water pipe burst causing road wash out',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Main Chowk' },
      status: COMPLAINT_STATUS.SUBMITTED,
    });

    const res = await request(app)
      .post(`/api/v1/operator/complaints/${complaint._id}/forward`)
      .set('Authorization', `Bearer ${roadsOperatorToken}`)
      .send({
        targetDepartmentId: waterDept._id.toString(),
        note: 'Requires water pipeline repair first',
      });

    expect(res.status).toBe(200);

    const updated = await Complaint.findById(complaint._id);
    expect(updated.departmentId.toString()).toBe(waterDept._id.toString());
    expect(updated.status).toBe(COMPLAINT_STATUS.SUBMITTED);
    expect(updated.forwardCount).toBe(1);

    // Should no longer appear in roads operator queue
    const queueRes = await request(app)
      .get('/api/v1/operator/complaints')
      .set('Authorization', `Bearer ${roadsOperatorToken}`);

    expect(queueRes.body.data.items.length).toBe(0);
  });
});
