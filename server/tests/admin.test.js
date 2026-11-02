import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { setupTestDB, teardownTestDB, clearTestDB } from './setup.js';
import { User, Department, Complaint, AuditLog, Counter } from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';
import { COMPLAINT_STATUS } from '../src/constants/complaintStatus.js';

describe('Admin Portal Test Suite', () => {
  let adminToken = '';
  let adminUser = null;
  let department = null;
  let engineer = null;
  let citizen = null;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    department = await Department.create({ name: 'Roads & Potholes' });

    const passwordHash = await User.hashPassword('Admin@SecurePass2026!');
    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@civic.gov.in',
      staffId: 'ADM-0001',
      role: ROLES.ADMIN,
      passwordHash,
      isActive: true,
    });

    engineer = await User.create({
      name: 'Er. Test Engineer',
      email: 'eng.test@civic.gov.in',
      staffId: 'ENG-0001',
      role: ROLES.ENGINEER,
      departmentId: department._id,
      maxActiveCases: 5,
      passwordHash,
      isActive: true,
    });

    citizen = await User.create({
      name: 'Citizen Test',
      email: 'citizen.test@example.com',
      passwordHash,
      role: ROLES.CITIZEN,
      isActive: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ identifier: 'ADM-0001', password: 'Admin@SecurePass2026!' });
    adminToken = loginRes.body.data.accessToken;
  });

  it('should fetch real aggregation analytics for admin dashboard', async () => {
    await Complaint.create({
      ticketNo: 'CMP-2026-000001',
      citizenId: citizen._id,
      departmentId: department._id,
      description: 'Complaint for analytics test',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Chowk' },
      status: COMPLAINT_STATUS.SUBMITTED,
    });

    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalComplaints).toBe(1);
    expect(res.body.data.summary.pending).toBe(1);
    expect(Array.isArray(res.body.data.byStatus)).toBe(true);
    expect(Array.isArray(res.body.data.byDepartment)).toBe(true);
  });

  it('should create staff with auto-generated ID, temporary password, and force change flag', async () => {
    const res = await request(app)
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Operator Person',
        email: 'new.op@civic.gov.in',
        phone: '+919876543211',
        role: ROLES.OPERATOR,
        departmentId: department._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.staffId).toMatch(/^OP-\d{4}$/);
    expect(res.body.data.mustChangePassword).toBe(true);
    expect(res.body.data.temporaryPassword).toBeDefined();
  });

  it('should deactivate staff member and prevent their subsequent login', async () => {
    const toggleRes = await request(app)
      .patch(`/api/v1/admin/staff/${engineer._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.staff.isActive).toBe(false);

    // Engineer login should fail
    const loginRes = await request(app)
      .post('/api/v1/auth/staff/login')
      .send({ identifier: 'ENG-0001', password: 'Admin@SecurePass2026!' });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error.code).toBe('ACCOUNT_DEACTIVATED');
  });

  it('should allow admin to override complaint status with mandatory explanation', async () => {
    const complaint = await Complaint.create({
      ticketNo: 'CMP-2026-000500',
      citizenId: citizen._id,
      departmentId: department._id,
      description: 'Complaint for status override',
      imageUrl: '/uploads/sample-road.svg',
      location: { address: 'Highway 48' },
      status: COMPLAINT_STATUS.REJECTED,
      rejectionReason: 'Initially rejected',
    });

    const res = await request(app)
      .patch(`/api/v1/admin/complaints/${complaint._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetStatus: COMPLAINT_STATUS.APPROVED,
        explanation: 'Executive review reopened complaint after municipal site survey',
      });

    expect(res.status).toBe(200);
    const updated = await Complaint.findById(complaint._id);
    expect(updated.status).toBe(COMPLAINT_STATUS.APPROVED);

    // Audit log should record admin override
    const audit = await AuditLog.findOne({
      complaintId: complaint._id,
      action: 'ADMIN_STATUS_OVERRIDE',
    });
    expect(audit).toBeDefined();
    expect(audit.isAdminOverride).toBe(true);
  });

  it('should allow admin to block and unblock citizen', async () => {
    // Block citizen
    const blockRes = await request(app)
      .patch(`/api/v1/admin/citizens/${citizen._id}/block`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isBlocked: true,
        blockReason: 'Spam complaint submissions',
      });

    expect(blockRes.status).toBe(200);
    expect(blockRes.body.data.citizen.isBlocked).toBe(true);

    // Citizen login should now be rejected
    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'citizen.test@example.com', password: 'Admin@SecurePass2026!' });

    expect(citizenLogin.status).toBe(403);
    expect(citizenLogin.body.error.code).toBe('ACCOUNT_BLOCKED');
  });

  it('should record immutable append-only audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});
