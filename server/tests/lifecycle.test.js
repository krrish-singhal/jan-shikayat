import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { User, Department, Complaint, ComplaintEvent, AuditLog } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';
import { COMPLAINT_STATUS } from '../src/constants/complaintStatus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplePng = path.resolve(__dirname, 'fixtures/sample.png');

describe('End-to-End Complaint Lifecycle Suite', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  it('should successfully execute the complete 6-stage lifecycle', async () => {
    // 1. Setup Department & Staff
    const department = await Department.create({ name: 'Roads & Potholes' });
    const staffPass = await User.hashPassword('Staff@Pass123!');

    const operator = await User.create({
      name: 'Operator Verma',
      email: 'operator@civic.gov.in',
      staffId: 'OP-0001',
      role: ROLES.OPERATOR,
      departmentId: department._id,
      passwordHash: staffPass,
      isActive: true,
    });

    const engineer = await User.create({
      name: 'Er. Kulkarni',
      email: 'engineer@civic.gov.in',
      staffId: 'ENG-0001',
      role: ROLES.ENGINEER,
      departmentId: department._id,
      maxActiveCases: 5,
      passwordHash: staffPass,
      isActive: true,
    });

    const admin = await User.create({
      name: 'Admin Officer',
      email: 'admin@civic.gov.in',
      staffId: 'ADM-0001',
      role: ROLES.ADMIN,
      passwordHash: staffPass,
      isActive: true,
    });

    // 2. Citizen Registers
    const citizenReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Citizen Vikram',
        email: 'vikram@example.com',
        password: 'Password@123!',
        phone: '+919988771122',
      });
    expect(citizenReg.status).toBe(201);
    const citizenToken = citizenReg.body.data.accessToken;

    // 3. Citizen Registers Complaint (Stage 1: SUBMITTED)
    const compSubmit = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${citizenToken}`)
      .field('departmentId', department._id.toString())
      .field('description', 'Severe pothole cluster in front of metro pillar 45')
      .field('address', 'MG Road Metro Pillar 45')
      .field('latitude', '18.5204')
      .field('longitude', '73.8567')
      .attach('image', samplePng);

    expect(compSubmit.status).toBe(201);
    const complaintId = compSubmit.body.data.complaint._id;
    const ticketNo = compSubmit.body.data.ticketNo;
    expect(ticketNo).toBeDefined();

    // 4. Operator Login & Accepts Complaint (Stage 2: VERIFICATION_NEEDED)
    const opLogin = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ identifier: 'OP-0001', password: 'Staff@Pass123!' });
    const opToken = opLogin.body.data.accessToken;

    const opAccept = await request(app)
      .post(`/api/v1/operator/complaints/${complaintId}/accept`)
      .set('Authorization', `Bearer ${opToken}`)
      .send({ note: 'Preliminary desk review passed, routed for ground engineer' });

    expect(opAccept.status).toBe(200);

    // 5. Joint Engineer Login & Picks up Complaint (Stage 3: VERIFICATION_IN_PROGRESS)
    const engLogin = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ identifier: 'ENG-0001', password: 'Staff@Pass123!' });
    const engToken = engLogin.body.data.accessToken;

    const engPickup = await request(app)
      .post(`/api/v1/engineer/complaints/${complaintId}/pickup`)
      .set('Authorization', `Bearer ${engToken}`);

    expect(engPickup.status).toBe(200);

    // 6. Joint Engineer Approves Ground Verification (Stage 4: APPROVED)
    const engApprove = await request(app)
      .post(`/api/v1/engineer/complaints/${complaintId}/approve`)
      .set('Authorization', `Bearer ${engToken}`)
      .send({ note: 'Site verified in person. Work order approved.' });

    expect(engApprove.status).toBe(200);

    // 7. Joint Engineer Starts Work On-Site (Stage 5: WORK_IN_PROGRESS)
    const engStart = await request(app)
      .post(`/api/v1/engineer/complaints/${complaintId}/start`)
      .set('Authorization', `Bearer ${engToken}`)
      .send({ note: 'Road repair machinery and hot-mix asphalt asphalt arrived on site' });

    expect(engStart.status).toBe(200);

    // 8. Joint Engineer Completes Work (Stage 6: COMPLETED with Completion Photo)
    const engComplete = await request(app)
      .post(`/api/v1/engineer/complaints/${complaintId}/complete`)
      .set('Authorization', `Bearer ${engToken}`)
      .field('completionNote', 'Potholes fully filled, rolled, and road opened for normal vehicular traffic.')
      .attach('image', samplePng);

    expect(engComplete.status).toBe(200);

    // 9. Citizen Views Complaint Details
    const citizenView = await request(app)
      .get(`/api/v1/complaints/${complaintId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(citizenView.status).toBe(200);
    expect(citizenView.body.data.status).toBe('Completed');
    expect(citizenView.body.data.completionNote).toContain('fully filled');
    expect(citizenView.body.data.completionImageUrl).toBeDefined();
    expect(citizenView.body.data.timeline.length).toBeGreaterThanOrEqual(6);

    // 10. Admin Views Full Audit Trail
    const adminLogin = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ identifier: 'ADM-0001', password: 'Staff@Pass123!' });
    const adminToken = adminLogin.body.data.accessToken;

    const adminAudit = await request(app)
      .get(`/api/v1/admin/audit?complaintId=${complaintId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminAudit.status).toBe(200);
    expect(adminAudit.body.data.items.length).toBeGreaterThan(0);
  });
});
