import mongoose from 'mongoose';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Complaint } from '../models/Complaint.js';
import { ComplaintEvent } from '../models/ComplaintEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';
import { COMPLAINT_STATUS, COMPLAINT_ACTIONS, ENGINEER_ACTIVE_STATUSES } from '../constants/complaintStatus.js';
import { generateStaffId } from '../utils/staffIdGenerator.js';
import { applyTransition, getEngineerActiveCaseCount } from '../services/complaintStateMachine.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

export class AdminController {
  /**
   * 7.1 Real-Time Analytics Dashboard
   */
  static async getDashboardStats(req, res) {
    try {
      const [
        totalComplaints,
        totalCitizens,
        totalStaff,
        pendingCount,
        verificationNeededCount,
        inProgressCount,
        completedCount,
        rejectedCount,
        byStatusRaw,
        byDeptRaw,
        recentComplaints,
        recentCitizens,
        recentStaff,
      ] = await Promise.all([
        Complaint.countDocuments(),
        User.countDocuments({ role: ROLES.CITIZEN, isDeleted: false }),
        User.countDocuments({ role: { $in: STAFF_ROLES }, isDeleted: false }),
        Complaint.countDocuments({
          status: {
            $in: [
              COMPLAINT_STATUS.SUBMITTED,
              COMPLAINT_STATUS.VERIFICATION_NEEDED,
              COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
            ],
          },
        }),
        Complaint.countDocuments({ status: COMPLAINT_STATUS.VERIFICATION_NEEDED }),
        Complaint.countDocuments({ status: COMPLAINT_STATUS.WORK_IN_PROGRESS }),
        Complaint.countDocuments({ status: COMPLAINT_STATUS.COMPLETED }),
        Complaint.countDocuments({ status: COMPLAINT_STATUS.REJECTED }),

        // Status breakdown aggregation
        Complaint.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),

        // Department breakdown aggregation
        Complaint.aggregate([
          { $group: { _id: '$departmentId', count: { $sum: 1 } } },
          {
            $lookup: {
              from: 'departments',
              localField: '_id',
              foreignField: '_id',
              as: 'dept',
            },
          },
          { $unwind: '$dept' },
          { $project: { name: '$dept.name', count: 1 } },
        ]),

        // Recent complaints
        Complaint.find()
          .populate('citizenId', 'name email phone')
          .populate('departmentId', 'name')
          .sort({ createdAt: -1 })
          .limit(6),

        // Recent citizens
        User.find({ role: ROLES.CITIZEN, isDeleted: false })
          .select('name email phone createdAt isBlocked')
          .sort({ createdAt: -1 })
          .limit(5),

        // Recent staff
        User.find({ role: { $in: STAFF_ROLES }, isDeleted: false })
          .populate('departmentId', 'name')
          .select('name email phone role staffId departmentId isActive createdAt')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      // Monthly trends aggregation (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const monthlyStats = await Complaint.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            registered: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.COMPLETED] }, 1, 0] },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedMonthly = monthlyStats.map((m) => ({
        month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
        registered: m.registered,
        completed: m.completed,
      }));

      // Department Performance
      const deptPerformance = await Complaint.aggregate([
        {
          $group: {
            _id: '$departmentId',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.COMPLETED] }, 1, 0] },
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', COMPLAINT_STATUS.WORK_IN_PROGRESS] }, 1, 0] },
            },
            pending: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      [
                        COMPLAINT_STATUS.SUBMITTED,
                        COMPLAINT_STATUS.VERIFICATION_NEEDED,
                        COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
                      ],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: '$department' },
        {
          $project: {
            name: '$department.name',
            total: 1,
            completed: 1,
            inProgress: 1,
            pending: 1,
            resolutionRate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1] },
                0,
              ],
            },
          },
        },
        { $sort: { total: -1 } },
      ]);

      // Complaints pending > 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const delayedComplaints = await Complaint.find({
        status: {
          $in: [
            COMPLAINT_STATUS.SUBMITTED,
            COMPLAINT_STATUS.VERIFICATION_NEEDED,
            COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
            COMPLAINT_STATUS.APPROVED,
          ],
        },
        createdAt: { $lte: sevenDaysAgo },
      })
        .populate('departmentId', 'name')
        .populate('assignedEngineerId', 'name staffId')
        .sort({ createdAt: 1 })
        .limit(10);

      return sendSuccess(res, {
        summary: {
          totalComplaints,
          totalCitizens,
          totalStaff,
          pending: pendingCount,
          verificationNeeded: verificationNeededCount,
          inProgress: inProgressCount,
          completed: completedCount,
          rejected: rejectedCount,
        },
        byStatus: byStatusRaw.map((s) => ({ status: s._id, count: s.count })),
        byDepartment: byDeptRaw,
        monthlyTrends: formattedMonthly,
        departmentPerformance: deptPerformance,
        delayedComplaints,
        recentComplaints,
        recentCitizens,
        recentStaff,
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.2 Staff Management - List Staff
   */
  static async getStaffList(req, res) {
    try {
      const { page = 1, limit = 10, role = '', departmentId = '', search = '', status = '' } = req.query;
      const query = { role: { $in: STAFF_ROLES }, isDeleted: false };

      if (role && role !== 'ALL') query.role = role;
      if (departmentId && departmentId !== 'ALL') query.departmentId = departmentId;
      if (status === 'ACTIVE') query.isActive = true;
      if (status === 'INACTIVE') query.isActive = false;

      if (search) {
        query.$or = [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
          { staffId: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const total = await User.countDocuments(query);
      const staffMembers = await User.find(query)
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      // For engineers, attach live active case count
      const items = await Promise.all(
        staffMembers.map(async (staff) => {
          const json = staff.toJSON();
          if (staff.role === ROLES.ENGINEER) {
            json.activeCases = await getEngineerActiveCaseCount(staff._id, Complaint);
          }
          return json;
        })
      );

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.2 Staff Management - Get Staff Detail
   */
  static async getStaffDetail(req, res) {
    try {
      const staff = await User.findOne({
        _id: req.params.id,
        role: { $in: STAFF_ROLES },
        isDeleted: false,
      }).populate('departmentId', 'name isActive');

      if (!staff) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Staff member not found' }, 404);
      }

      const data = staff.toJSON();
      if (staff.role === ROLES.ENGINEER) {
        const assignedComplaints = await Complaint.find({
          assignedEngineerId: staff._id,
          status: { $in: ENGINEER_ACTIVE_STATUSES },
        }).populate('departmentId', 'name');
        data.activeCases = assignedComplaints.length;
        data.assignedComplaints = assignedComplaints;
      }

      return sendSuccess(res, data);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.2 Staff Management - Create Staff
   */
  static async createStaff(req, res) {
    try {
      const { name, email, phone, role, departmentId, maxActiveCases } = req.body;

      const existing = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
      if (existing) {
        return sendError(res, { code: 'EMAIL_IN_USE', message: 'Email address is already registered' }, 409);
      }

      if (departmentId) {
        const dept = await Department.findById(departmentId);
        if (!dept) {
          return sendError(res, { code: 'INVALID_DEPARTMENT', message: 'Specified department does not exist' }, 400);
        }
      }

      const staffId = await generateStaffId(role);
      // Generate secure temporary password
      const tempPassword = `Temp@${crypto.randomBytes(4).toString('hex')}2026`;
      const passwordHash = await User.hashPassword(tempPassword);

      const staff = await User.create({
        name,
        email: email.toLowerCase(),
        phone: phone || '',
        role,
        staffId,
        departmentId: departmentId || null,
        maxActiveCases: role === ROLES.ENGINEER ? (maxActiveCases || 5) : 5,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      });

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_CREATE_STAFF',
        notes: `Created staff member ${staff.name} (${staff.staffId}) with role ${staff.role}`,
        metadata: { staffId: staff.staffId, role: staff.role },
      });

      const responseData = staff.toJSON();
      // Provide temporary password ONCE upon creation as required by specification
      responseData.temporaryPassword = tempPassword;

      return sendSuccess(res, responseData, 201);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.2 Staff Management - Update Staff
   */
  static async updateStaff(req, res) {
    try {
      const { name, phone, departmentId, role, maxActiveCases } = req.body;
      const staff = await User.findOne({ _id: req.params.id, role: { $in: STAFF_ROLES }, isDeleted: false });

      if (!staff) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Staff member not found' }, 404);
      }

      // Check if engineer has active cases before changing department
      if (departmentId && String(departmentId) !== String(staff.departmentId)) {
        if (staff.role === ROLES.ENGINEER) {
          const activeCases = await getEngineerActiveCaseCount(staff._id, Complaint);
          if (activeCases > 0) {
            return sendError(
              res,
              {
                code: 'HAS_ACTIVE_CASES',
                message: `Cannot change department. Engineer currently has ${activeCases} active cases. Reassign them first.`,
              },
              422
            );
          }
        }
        const dept = await Department.findById(departmentId);
        if (!dept) {
          return sendError(res, { code: 'INVALID_DEPARTMENT', message: 'Target department does not exist' }, 400);
        }
        staff.departmentId = departmentId;
      }

      if (name) staff.name = name;
      if (phone !== undefined) staff.phone = phone;
      if (role && STAFF_ROLES.includes(role)) staff.role = role;
      if (maxActiveCases) staff.maxActiveCases = maxActiveCases;

      await staff.save();

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_UPDATE_STAFF',
        notes: `Updated staff profile for ${staff.name} (${staff.staffId})`,
        metadata: { staffId: staff.staffId },
      });

      return sendSuccess(res, staff.toJSON());
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.2 Staff Management - Toggle Staff Status (Active / Deactive)
   */
  static async toggleStaffStatus(req, res) {
    try {
      const { isActive } = req.body;
      const staff = await User.findOne({ _id: req.params.id, role: { $in: STAFF_ROLES }, isDeleted: false });

      if (!staff) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Staff member not found' }, 404);
      }

      staff.isActive = typeof isActive === 'boolean' ? isActive : !staff.isActive;
      await staff.save();

      // Revoke refresh tokens on deactivation
      if (!staff.isActive) {
        await RefreshToken.updateMany({ userId: staff._id }, { $set: { revokedAt: new Date() } });
      }

      // If deactivated engineer has active complaints, warn admin
      let activeCases = [];
      if (!staff.isActive && staff.role === ROLES.ENGINEER) {
        activeCases = await Complaint.find({
          assignedEngineerId: staff._id,
          status: { $in: ENGINEER_ACTIVE_STATUSES },
        }).select('ticketNo status description');
      }

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: staff.isActive ? 'ADMIN_REACTIVATE_STAFF' : 'ADMIN_DEACTIVATE_STAFF',
        notes: `${staff.isActive ? 'Reactivated' : 'Deactivated'} staff ${staff.name} (${staff.staffId})`,
        metadata: { staffId: staff.staffId, isActive: staff.isActive },
      });

      return sendSuccess(res, {
        staff: staff.toJSON(),
        activeCasesRequiringReassignment: activeCases,
        message: staff.isActive ? 'Staff reactivated successfully' : 'Staff deactivated successfully',
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.2 Staff Management - Reset Staff Password
   */
  static async resetStaffPassword(req, res) {
    try {
      const staff = await User.findOne({ _id: req.params.id, role: { $in: STAFF_ROLES }, isDeleted: false });
      if (!staff) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Staff member not found' }, 404);
      }

      const tempPassword = `Reset@${crypto.randomBytes(4).toString('hex')}2026`;
      staff.passwordHash = await User.hashPassword(tempPassword);
      staff.mustChangePassword = true;
      await staff.save();

      // Invalidate existing sessions
      await RefreshToken.updateMany({ userId: staff._id }, { $set: { revokedAt: new Date() } });

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_RESET_STAFF_PASSWORD',
        notes: `Reset password for staff member ${staff.name} (${staff.staffId})`,
        metadata: { staffId: staff.staffId },
      });

      return sendSuccess(res, {
        temporaryPassword: tempPassword,
        message: 'Password reset successfully. Provide the temporary password to the staff member.',
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.3 Department Management - List Departments
   */
  static async getDepartments(req, res) {
    try {
      const departments = await Department.find().sort({ name: 1 });
      const stats = await Promise.all(
        departments.map(async (dept) => {
          const complaintCount = await Complaint.countDocuments({ departmentId: dept._id });
          const staffCount = await User.countDocuments({ departmentId: dept._id, isDeleted: false });
          return {
            ...dept.toObject(),
            complaintCount,
            staffCount,
          };
        })
      );
      return sendSuccess(res, stats);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.3 Department Management - Create Department
   */
  static async createDepartment(req, res) {
    try {
      const { name, description } = req.body;
      const existing = await Department.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });

      if (existing) {
        return sendError(res, { code: 'DUPLICATE_DEPARTMENT', message: 'A department with this name already exists' }, 409);
      }

      const dept = await Department.create({
        name: name.trim(),
        description: description?.trim() || '',
        isActive: true,
      });

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_CREATE_DEPARTMENT',
        notes: `Created new municipal department: ${dept.name}`,
        metadata: { departmentId: dept._id },
      });

      return sendSuccess(res, dept, 201);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.3 Department Management - Update Department
   */
  static async updateDepartment(req, res) {
    try {
      const { name, description, isActive } = req.body;
      const dept = await Department.findById(req.params.id);

      if (!dept) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Department not found' }, 404);
      }

      if (name && name.trim() !== dept.name) {
        const existing = await Department.findOne({
          _id: { $ne: dept._id },
          name: { $regex: `^${name.trim()}$`, $options: 'i' },
        });
        if (existing) {
          return sendError(res, { code: 'DUPLICATE_DEPARTMENT', message: 'Another department already has this name' }, 409);
        }
        dept.name = name.trim();
      }

      if (description !== undefined) dept.description = description.trim();
      if (isActive !== undefined) dept.isActive = isActive;

      await dept.save();

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_UPDATE_DEPARTMENT',
        notes: `Updated department: ${dept.name}`,
        metadata: { departmentId: dept._id },
      });

      return sendSuccess(res, dept);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.3 Department Management - Soft Delete / Deactivate
   * Requirement: Do not physically delete departments referenced by existing complaints or staff.
   */
  static async deactivateDepartment(req, res) {
    try {
      const dept = await Department.findById(req.params.id);
      if (!dept) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Department not found' }, 404);
      }

      dept.isActive = false;
      await dept.save();

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_DEACTIVATE_DEPARTMENT',
        notes: `Deactivated department: ${dept.name}`,
        metadata: { departmentId: dept._id },
      });

      return sendSuccess(res, { message: `Department '${dept.name}' deactivated successfully.` });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.4 Complaint Management - Cross-department complaints list
   */
  static async getAllComplaints(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = '',
        departmentId = '',
        engineerId = '',
        citizenId = '',
        search = '',
        startDate = '',
        endDate = '',
      } = req.query;

      const query = {};

      if (status && status !== 'ALL') query.status = status;
      if (departmentId && departmentId !== 'ALL') query.departmentId = departmentId;
      if (engineerId && engineerId !== 'ALL') query.assignedEngineerId = engineerId;
      if (citizenId && citizenId !== 'ALL') query.citizenId = citizenId;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }

      if (search) {
        query.$or = [
          { ticketNo: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const total = await Complaint.countDocuments(query);
      const items = await Complaint.find(query)
        .populate('citizenId', 'name email phone')
        .populate('departmentId', 'name')
        .populate('assignedEngineerId', 'name staffId phone email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.4 Complaint Management - Get Full Detail & Timeline
   */
  static async getComplaintDetail(req, res) {
    try {
      const complaint = await Complaint.findById(req.params.id)
        .populate('citizenId', 'name email phone createdAt isBlocked')
        .populate('departmentId', 'name isActive')
        .populate('assignedEngineerId', 'name staffId phone email departmentId');

      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      const events = await ComplaintEvent.find({ complaintId: complaint._id })
        .populate('actorId', 'name role staffId email')
        .sort({ createdAt: 1 });

      const auditLogs = await AuditLog.find({ complaintId: complaint._id }).sort({ createdAt: 1 });

      return sendSuccess(res, { complaint, events, auditLogs });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.4 Complaint Management - Admin Status Override
   * Exceptional operation with mandatory explanation and audit event.
   */
  static async overrideComplaintStatus(req, res) {
    try {
      const { targetStatus, explanation } = req.body;
      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.ADMIN_OVERRIDE, req.user, {
        targetStatus,
        explanation,
      });

      return sendSuccess(res, { complaint, message: 'Complaint status overridden successfully.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * 7.4 Complaint Management - Reassign Engineer
   */
  static async reassignEngineer(req, res) {
    try {
      const { engineerId, force = false, reason } = req.body;
      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      const engineer = await User.findOne({
        _id: engineerId,
        role: ROLES.ENGINEER,
        isActive: true,
        isDeleted: false,
      });

      if (!engineer) {
        return sendError(res, { code: 'INVALID_ENGINEER', message: 'Target engineer not found or inactive' }, 404);
      }

      if (String(engineer.departmentId) !== String(complaint.departmentId)) {
        return sendError(
          res,
          {
            code: 'DEPARTMENT_MISMATCH',
            message: 'Engineer belongs to a different department than this complaint',
          },
          422
        );
      }

      // Check capacity unless explicit force
      if (!force) {
        const activeCount = await getEngineerActiveCaseCount(engineer._id, Complaint);
        const maxCapacity = engineer.maxActiveCases || 5;
        if (activeCount >= maxCapacity) {
          return sendError(
            res,
            {
              code: 'CAPACITY_REACHED',
              message: `Engineer ${engineer.name} has reached maximum active capacity (${activeCount}/${maxCapacity}). Use force override to assign regardless.`,
            },
            422
          );
        }
      }

      const previousEngineerId = complaint.assignedEngineerId;
      complaint.assignedEngineerId = engineer._id;
      // If complaint was VERIFICATION_NEEDED, transition it to VERIFICATION_IN_PROGRESS
      if (complaint.status === COMPLAINT_STATUS.VERIFICATION_NEEDED) {
        complaint.status = COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS;
      }
      await complaint.save();

      const note = `Engineer reassigned by Admin to ${engineer.name} (${engineer.staffId}). Reason: ${reason}`;

      await ComplaintEvent.create({
        complaintId: complaint._id,
        actorId: req.user._id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        action: COMPLAINT_ACTIONS.ADMIN_REASSIGN,
        note,
        isAdminOverride: true,
        metadata: {
          previousEngineerId,
          newEngineerId: engineer._id,
          reason,
          forced: force,
        },
      });

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_REASSIGN_ENGINEER',
        complaintId: complaint._id,
        assignedEngineer: `${engineer.name} (${engineer.staffId})`,
        notes: note,
        isAdminOverride: true,
        metadata: { previousEngineerId, newEngineerId: engineer._id, force },
      });

      return sendSuccess(res, { complaint, message: 'Engineer reassigned successfully.' });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.4 Complaint Management - Change Department
   */
  static async changeComplaintDepartment(req, res) {
    try {
      const { departmentId, reason } = req.body;
      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      const targetDept = await Department.findOne({ _id: departmentId, isActive: true });
      if (!targetDept) {
        return sendError(res, { code: 'INVALID_DEPARTMENT', message: 'Department not found or inactive' }, 404);
      }

      const oldDeptId = complaint.departmentId;
      complaint.departmentId = targetDept._id;
      // Clear assigned engineer since engineer belongs to previous department
      complaint.assignedEngineerId = null;
      if (complaint.status === COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS) {
        complaint.status = COMPLAINT_STATUS.VERIFICATION_NEEDED;
      }
      complaint.forwardCount = (complaint.forwardCount || 0) + 1;
      await complaint.save();

      const note = `Department changed by Admin to ${targetDept.name}. Reason: ${reason || 'Administrative routing'}`;

      await ComplaintEvent.create({
        complaintId: complaint._id,
        actorId: req.user._id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        action: COMPLAINT_ACTIONS.ADMIN_DEPARTMENT_CHANGE,
        note,
        isAdminOverride: true,
        metadata: { oldDeptId, newDeptId: targetDept._id, reason },
      });

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_CHANGE_DEPARTMENT',
        complaintId: complaint._id,
        previousDepartment: String(oldDeptId),
        newDepartment: targetDept.name,
        notes: note,
        isAdminOverride: true,
      });

      return sendSuccess(res, { complaint, message: 'Complaint department updated successfully.' });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.5 Citizen Management - List Citizens
   */
  static async getCitizensList(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = req.query;
      const query = { role: ROLES.CITIZEN, isDeleted: false };

      if (status === 'BLOCKED') query.isBlocked = true;
      if (status === 'ACTIVE') query.isBlocked = false;

      if (search) {
        query.$or = [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
          { phone: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const total = await User.countDocuments(query);
      const citizens = await User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const items = await Promise.all(
        citizens.map(async (c) => {
          const complaintCount = await Complaint.countDocuments({ citizenId: c._id });
          return {
            ...c.toJSON(),
            complaintCount,
          };
        })
      );

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.5 Citizen Management - Toggle Block
   */
  static async toggleCitizenBlock(req, res) {
    try {
      const { isBlocked, blockReason } = req.body;
      const citizen = await User.findOne({ _id: req.params.id, role: ROLES.CITIZEN });

      if (!citizen) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Citizen not found' }, 404);
      }

      citizen.isBlocked = isBlocked;
      citizen.blockReason = isBlocked ? (blockReason || 'Blocked by Administrator') : '';
      await citizen.save();

      if (isBlocked) {
        // Invalidate refresh tokens
        await RefreshToken.updateMany({ userId: citizen._id }, { $set: { revokedAt: new Date() } });
      }

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: isBlocked ? 'ADMIN_BLOCK_CITIZEN' : 'ADMIN_UNBLOCK_CITIZEN',
        notes: `${isBlocked ? 'Blocked' : 'Unblocked'} citizen ${citizen.name} (${citizen.email}). Reason: ${citizen.blockReason}`,
        metadata: { citizenId: citizen._id, isBlocked },
      });

      return sendSuccess(res, {
        citizen: citizen.toJSON(),
        message: isBlocked ? 'Citizen account blocked' : 'Citizen account unblocked',
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.5 Citizen Management - Anonymize / Delete Citizen
   */
  static async anonymizeCitizen(req, res) {
    try {
      const citizen = await User.findOne({ _id: req.params.id, role: ROLES.CITIZEN });
      if (!citizen) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Citizen not found' }, 404);
      }

      const anonymizedId = citizen._id.toString();
      citizen.name = 'Anonymized Citizen';
      citizen.email = `deleted_${anonymizedId}@anonymized.local`;
      citizen.phone = '';
      citizen.passwordHash = 'ANONYMIZED';
      citizen.googleId = undefined;
      citizen.isDeleted = true;
      citizen.deletedAt = new Date();
      await citizen.save();

      await RefreshToken.updateMany({ userId: citizen._id }, { $set: { revokedAt: new Date() } });

      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ADMIN_ANONYMIZE_CITIZEN',
        notes: `Anonymized citizen record ID ${anonymizedId} per privacy retention rules`,
        metadata: { citizenId: citizen._id },
      });

      return sendSuccess(res, { message: 'Citizen data anonymized while retaining municipal complaint history.' });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * 7.6 Append-Only Audit Logs
   */
  static async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        action = '',
        actorId = '',
        complaintId = '',
        search = '',
        startDate = '',
        endDate = '',
      } = req.query;

      const query = {};

      if (action && action !== 'ALL') query.action = action;
      if (actorId && actorId !== 'ALL') query.actorId = actorId;
      if (complaintId) query.complaintId = complaintId;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }

      if (search) {
        query.$or = [
          { notes: { $regex: search.trim(), $options: 'i' } },
          { actorName: { $regex: search.trim(), $options: 'i' } },
          { action: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const total = await AuditLog.countDocuments(query);
      const items = await AuditLog.find(query)
        .populate('complaintId', 'ticketNo')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }
}
