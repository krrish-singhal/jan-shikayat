import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Department,
  Complaint,
  ComplaintEvent,
  AuditLog,
  Counter,
  RefreshToken,
  PasswordReset,
  Notification,
} from '../src/models/index.js';
import { ROLES } from '../src/constants/roles.js';
import { COMPLAINT_STATUS, COMPLAINT_ACTIONS } from '../src/constants/complaintStatus.js';

async function seed() {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing test data...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Complaint.deleteMany({}),
      ComplaintEvent.deleteMany({}),
      AuditLog.deleteMany({}),
      Counter.deleteMany({}),
      RefreshToken.deleteMany({}),
      PasswordReset.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Creating municipal departments...');
    const departmentsData = [
      { name: 'Roads & Potholes', description: 'Road maintenance, potholes, asphalt resurfacing, and pavement repairs.' },
      { name: 'Water Supply', description: 'Potable water pipelines, contamination issues, low water pressure, and leaks.' },
      { name: 'Sanitation & Waste Management', description: 'Garbage collection, street sweeping, dump yards, and bio-waste management.' },
      { name: 'Street Lighting', description: 'Faulty street lamps, dark corridors, transformer fuse repairs, and LED replacements.' },
      { name: 'Drainage & Sewage', description: 'Clogged storm drains, sewage overflow, manhole maintenance, and gutter desilting.' },
      { name: 'Electricity Infrastructure', description: 'High-voltage wires, transformer sparkings, loose cables, and pole damage.' },
      { name: 'Public Health & Hygiene', description: 'Vector mosquito control, fogging drives, public urinal sanitization, and stray animal reporting.' },
    ];

    const departments = await Department.insertMany(departmentsData);
    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d.name] = d;
    });

    console.log('[Seed] Creating Administrator account...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@SecurePass2026!';
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Municipal Administrator',
      email: (process.env.ADMIN_EMAIL || 'admin@civic.gov.in').toLowerCase(),
      phone: process.env.ADMIN_PHONE || '+919876543210',
      passwordHash: await User.hashPassword(adminPassword),
      role: ROLES.ADMIN,
      staffId: 'ADM-0001',
      isActive: true,
      mustChangePassword: false,
    });
    await Counter.create({ name: 'staff_id_ADM', seq: 1 });

    console.log('[Seed] Creating Department Operators...');
    const defaultPassword = 'Staff@SecurePass2026!';
    const hashedStaffPass = await User.hashPassword(defaultPassword);

    const operators = await User.insertMany([
      {
        name: 'Suresh Verma (Operator)',
        email: 'operator.roads@civic.gov.in',
        phone: '+919811122201',
        passwordHash: hashedStaffPass,
        role: ROLES.OPERATOR,
        staffId: 'OP-0001',
        departmentId: deptMap['Roads & Potholes']._id,
        isActive: true,
        mustChangePassword: false,
      },
      {
        name: 'Meena Sharma (Operator)',
        email: 'operator.water@civic.gov.in',
        phone: '+919811122202',
        passwordHash: hashedStaffPass,
        role: ROLES.OPERATOR,
        staffId: 'OP-0002',
        departmentId: deptMap['Water Supply']._id,
        isActive: true,
        mustChangePassword: false,
      },
      {
        name: 'Kavita Rao (Operator)',
        email: 'operator.sanitation@civic.gov.in',
        phone: '+919811122203',
        passwordHash: hashedStaffPass,
        role: ROLES.OPERATOR,
        staffId: 'OP-0003',
        departmentId: deptMap['Sanitation & Waste Management']._id,
        isActive: true,
        mustChangePassword: false,
      },
    ]);
    await Counter.create({ name: 'staff_id_OP', seq: 3 });

    console.log('[Seed] Creating Joint Engineers...');
    const engineers = await User.insertMany([
      {
        name: 'Er. Rajesh Kulkarni (Joint Engineer)',
        email: 'engineer.roads@civic.gov.in',
        phone: '+919822233301',
        passwordHash: hashedStaffPass,
        role: ROLES.ENGINEER,
        staffId: 'ENG-0001',
        departmentId: deptMap['Roads & Potholes']._id,
        maxActiveCases: 5,
        isActive: true,
        mustChangePassword: false,
      },
      {
        name: 'Er. Vikram Joshi (Joint Engineer)',
        email: 'engineer.roads2@civic.gov.in',
        phone: '+919822233302',
        passwordHash: hashedStaffPass,
        role: ROLES.ENGINEER,
        staffId: 'ENG-0002',
        departmentId: deptMap['Roads & Potholes']._id,
        maxActiveCases: 5,
        isActive: true,
        mustChangePassword: false,
      },
      {
        name: 'Er. Sunita Deshmukh (Joint Engineer)',
        email: 'engineer.water@civic.gov.in',
        phone: '+919822233303',
        passwordHash: hashedStaffPass,
        role: ROLES.ENGINEER,
        staffId: 'ENG-0003',
        departmentId: deptMap['Water Supply']._id,
        maxActiveCases: 5,
        isActive: true,
        mustChangePassword: false,
      },
    ]);
    await Counter.create({ name: 'staff_id_ENG', seq: 3 });

    console.log('[Seed] Creating Sample Citizens...');
    const hashedCitizenPass = await User.hashPassword('Citizen@Pass2026!');
    const citizens = await User.insertMany([
      {
        name: 'Aarav Patel',
        email: 'aarav.patel@gmail.com',
        phone: '+919899112233',
        passwordHash: hashedCitizenPass,
        role: ROLES.CITIZEN,
        isActive: true,
      },
      {
        name: 'Pooja Gupta',
        email: 'pooja.gupta@gmail.com',
        phone: '+919899445566',
        passwordHash: hashedCitizenPass,
        role: ROLES.CITIZEN,
        isActive: true,
      },
      {
        name: 'Rohan Mehra',
        email: 'rohan.mehra@gmail.com',
        phone: '+919899778899',
        passwordHash: hashedCitizenPass,
        role: ROLES.CITIZEN,
        isActive: true,
      },
    ]);

    console.log('[Seed] Seeding complaints across all lifecycle statuses...');
    const roadsDept = deptMap['Roads & Potholes'];
    const waterDept = deptMap['Water Supply'];
    const engRoads1 = engineers[0];
    const opRoads = operators[0];
    const citizen1 = citizens[0];
    const citizen2 = citizens[1];

    const sampleImagePath = '/uploads/sample-road.svg';
    const sampleCompletedPath = '/uploads/sample-completed.svg';

    const complaintsData = [
      {
        ticketNo: 'CMP-2026-000001',
        citizenId: citizen1._id,
        departmentId: roadsDept._id,
        description: 'Large hazardous pothole right in front of Shanti Niketan Society main gate. Multiple two-wheelers slipping during morning commute.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Main Gate, Shanti Niketan Society, Ward 14, MG Road',
          latitude: 18.5204,
          longitude: 73.8567,
        },
        status: COMPLAINT_STATUS.SUBMITTED,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNo: 'CMP-2026-000002',
        citizenId: citizen1._id,
        departmentId: roadsDept._id,
        description: 'Broken road surface and sharp asphalt stones scattered across 50 meters near Civil Hospital junction.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Civil Hospital Junction, Station Road, Ward 12',
          latitude: 18.5284,
          longitude: 73.8647,
        },
        status: COMPLAINT_STATUS.VERIFICATION_NEEDED,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNo: 'CMP-2026-000003',
        citizenId: citizen2._id,
        departmentId: roadsDept._id,
        description: 'Severe cave-in on pavement corner opposite City Center Mall. Pedestrians forced onto busy vehicular road.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Opposite City Center Mall, North Avenue, Ward 15',
          latitude: 18.5342,
          longitude: 73.8491,
        },
        status: COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
        assignedEngineerId: engRoads1._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNo: 'CMP-2026-000004',
        citizenId: citizen2._id,
        departmentId: roadsDept._id,
        description: 'Deep ditch created during utility trenching left unpaved and unmarked near Saraswati School.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Saraswati High School Lane, Shivaji Nagar, Ward 9',
          latitude: 18.5305,
          longitude: 73.8522,
        },
        status: COMPLAINT_STATUS.APPROVED,
        assignedEngineerId: engRoads1._id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNo: 'CMP-2026-000005',
        citizenId: citizen1._id,
        departmentId: roadsDept._id,
        description: 'Multiple continuous potholes causing severe traffic backlog across Shivaji Chowk flyover ramp.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Flyover Entry Ramp, Shivaji Chowk, Ward 11',
          latitude: 18.5211,
          longitude: 73.8599,
        },
        status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
        assignedEngineerId: engRoads1._id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNo: 'CMP-2026-000006',
        citizenId: citizen1._id,
        departmentId: roadsDept._id,
        description: 'Crater-like pothole outside Model Colony bus stop. Water logging during evening rains.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Model Colony Bus Depot Road, Ward 7',
          latitude: 18.5388,
          longitude: 73.8344,
        },
        status: COMPLAINT_STATUS.COMPLETED,
        assignedEngineerId: engRoads1._id,
        completionNote: 'Road surface patched with hot-mix bitumen, steam-rolled and leveled. Quality inspection cleared.',
        completionImageUrl: sampleCompletedPath,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNo: 'CMP-2026-000007',
        citizenId: citizen2._id,
        departmentId: roadsDept._id,
        description: 'Private parking ramp constructed on private society land reported as public road issue.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Building B Internal Compound, Greenwood Society',
          latitude: 18.5412,
          longitude: 73.8421,
        },
        status: COMPLAINT_STATUS.REJECTED,
        rejectionReason: 'Issue is located inside private residential society compound. Outside municipal jurisdiction.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNo: 'CMP-2026-000008',
        citizenId: citizen2._id,
        departmentId: waterDept._id,
        description: 'Main municipal water supply pipeline leaking heavily on footpath. Clean drinking water wasting continuously.',
        imageUrl: sampleImagePath,
        location: {
          address: 'Near Water Tanker Depot, Tilak Road, Ward 4',
          latitude: 18.5089,
          longitude: 73.8543,
        },
        status: COMPLAINT_STATUS.SUBMITTED,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Delayed complaint for dashboard alert
      },
    ];

    const insertedComplaints = await Complaint.insertMany(complaintsData);
    await Counter.create({ name: 'complaint_ticket_2026', seq: 8 });

    console.log('[Seed] Recording event timelines for seeded complaints...');
    for (const c of insertedComplaints) {
      if (c.status === COMPLAINT_STATUS.SUBMITTED) {
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: c.citizenId,
          fromStatus: null,
          toStatus: COMPLAINT_STATUS.SUBMITTED,
          action: 'SUBMIT',
          note: 'Complaint registered by citizen',
          createdAt: c.createdAt,
        });
      } else if (c.status === COMPLAINT_STATUS.VERIFICATION_NEEDED) {
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: c.citizenId,
          fromStatus: null,
          toStatus: COMPLAINT_STATUS.SUBMITTED,
          action: 'SUBMIT',
          note: 'Complaint registered by citizen',
          createdAt: c.createdAt,
        });
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: opRoads._id,
          fromStatus: COMPLAINT_STATUS.SUBMITTED,
          toStatus: COMPLAINT_STATUS.VERIFICATION_NEEDED,
          action: 'ACCEPT',
          note: 'Complaint accepted by Operator for ground verification',
          createdAt: new Date(c.createdAt.getTime() + 3600000),
        });
      } else if (c.status === COMPLAINT_STATUS.COMPLETED) {
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: c.citizenId,
          fromStatus: null,
          toStatus: COMPLAINT_STATUS.SUBMITTED,
          action: 'SUBMIT',
          note: 'Complaint registered by citizen',
          createdAt: c.createdAt,
        });
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: opRoads._id,
          fromStatus: COMPLAINT_STATUS.SUBMITTED,
          toStatus: COMPLAINT_STATUS.VERIFICATION_NEEDED,
          action: 'ACCEPT',
          note: 'Complaint accepted for ground verification',
          createdAt: new Date(c.createdAt.getTime() + 3600000),
        });
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: engRoads1._id,
          fromStatus: COMPLAINT_STATUS.VERIFICATION_NEEDED,
          toStatus: COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
          action: 'PICKUP',
          note: 'Picked up by Joint Engineer',
          createdAt: new Date(c.createdAt.getTime() + 7200000),
        });
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: engRoads1._id,
          fromStatus: COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
          toStatus: COMPLAINT_STATUS.APPROVED,
          action: 'APPROVE',
          note: 'Ground inspection completed. Verified as severe pothole.',
          createdAt: new Date(c.createdAt.getTime() + 86400000),
        });
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: engRoads1._id,
          fromStatus: COMPLAINT_STATUS.APPROVED,
          toStatus: COMPLAINT_STATUS.WORK_IN_PROGRESS,
          action: 'START_WORK',
          note: 'Municipal road repair crew dispatched on site.',
          createdAt: new Date(c.createdAt.getTime() + 172800000),
        });
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: engRoads1._id,
          fromStatus: COMPLAINT_STATUS.WORK_IN_PROGRESS,
          toStatus: COMPLAINT_STATUS.COMPLETED,
          action: 'COMPLETE_WORK',
          note: c.completionNote,
          createdAt: c.updatedAt,
        });
      } else if (c.status === COMPLAINT_STATUS.REJECTED) {
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: c.citizenId,
          fromStatus: null,
          toStatus: COMPLAINT_STATUS.SUBMITTED,
          action: 'SUBMIT',
          note: 'Complaint registered by citizen',
          createdAt: c.createdAt,
        });
        await ComplaintEvent.create({
          complaintId: c._id,
          actorId: opRoads._id,
          fromStatus: COMPLAINT_STATUS.SUBMITTED,
          toStatus: COMPLAINT_STATUS.REJECTED,
          action: 'REJECT',
          note: `Rejected by Operator: ${c.rejectionReason}`,
          createdAt: new Date(c.createdAt.getTime() + 3600000),
        });
      }
    }

    console.log('[Seed] Database seeding completed successfully!');
    console.log('====================================================');
    console.log('PORTAL TEST CREDENTIALS:');
    console.log('1. Admin Portal:');
    console.log(`   Staff ID / Email: ADM-0001 / ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('2. Operator Portal:');
    console.log('   Staff ID / Email: OP-0001 / operator.roads@civic.gov.in');
    console.log(`   Password: ${defaultPassword}`);
    console.log('3. Joint Engineer Portal:');
    console.log('   Staff ID / Email: ENG-0001 / engineer.roads@civic.gov.in');
    console.log(`   Password: ${defaultPassword}`);
    console.log('4. Citizen Portal:');
    console.log('   Email: aarav.patel@gmail.com');
    console.log('   Password: Citizen@Pass2026!');
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    await disconnectDB();
    process.exit(1);
  }
}

seed();
