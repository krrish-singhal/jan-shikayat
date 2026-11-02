import { Complaint } from '../models/Complaint.js';
import { Department } from '../models/Department.js';
import { ComplaintEvent } from '../models/ComplaintEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { COMPLAINT_STATUS, CITIZEN_STATUS_MAP } from '../constants/complaintStatus.js';
import { generateTicketNumber } from '../utils/ticketGenerator.js';
import { UploadService } from '../services/uploadService.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

export class CitizenController {
  /**
   * Get Active Departments for dropdown
   */
  static async getActiveDepartments(req, res) {
    try {
      const departments = await Department.find({ isActive: true }).select('name description').sort({ name: 1 });
      return sendSuccess(res, departments);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Citizen Complaint Registration
   */
  static async registerComplaint(req, res) {
    try {
      if (!req.file) {
        return sendError(res, { code: 'IMAGE_REQUIRED', message: 'Complaint photograph is mandatory.' }, 400);
      }

      const { departmentId, description, address, latitude, longitude } = req.body;

      if (!description || description.trim().length < 10) {
        return sendError(res, { code: 'INVALID_DESCRIPTION', message: 'Description must be at least 10 characters long.' }, 400);
      }

      if (!address || address.trim().length < 3) {
        return sendError(res, { code: 'INVALID_ADDRESS', message: 'Address is required (at least 3 characters).' }, 400);
      }

      const department = await Department.findOne({ _id: departmentId, isActive: true });
      if (!department) {
        return sendError(res, { code: 'INVALID_DEPARTMENT', message: 'Selected department is invalid or inactive.' }, 400);
      }

      // Upload complaint photograph
      const imageUrl = await UploadService.uploadImage(req.file, 'complaints');
      const ticketNo = await generateTicketNumber();

      const complaint = await Complaint.create({
        ticketNo,
        citizenId: req.user._id,
        departmentId: department._id,
        description: description.trim(),
        imageUrl,
        location: {
          address: address.trim(),
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        },
        status: COMPLAINT_STATUS.SUBMITTED,
      });

      // Record ComplaintEvent
      await ComplaintEvent.create({
        complaintId: complaint._id,
        actorId: req.user._id,
        fromStatus: null,
        toStatus: COMPLAINT_STATUS.SUBMITTED,
        action: 'SUBMIT',
        note: 'Complaint registered by citizen',
      });

      // Record AuditLog
      await AuditLog.create({
        actorId: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'CITIZEN_SUBMIT_COMPLAINT',
        complaintId: complaint._id,
        newStatus: COMPLAINT_STATUS.SUBMITTED,
        newDepartment: department.name,
        notes: `Ticket ${ticketNo} registered in ${department.name}`,
      });

      return sendSuccess(
        res,
        {
          complaint,
          ticketNo,
          message: `Complaint registered successfully with Ticket #${ticketNo}`,
        },
        201
      );
    } catch (err) {
      return sendError(res, { code: 'REGISTRATION_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Get Citizen Complaints (Paginated, Filtered)
   */
  static async getMyComplaints(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = req.query;
      const query = { citizenId: req.user._id };

      if (search) {
        query.ticketNo = { $regex: search.trim(), $options: 'i' };
      }

      if (status && status !== 'ALL') {
        // Map citizen-facing status to internal statuses if needed
        if (status === 'Pending') {
          query.status = {
            $in: [
              COMPLAINT_STATUS.SUBMITTED,
              COMPLAINT_STATUS.VERIFICATION_NEEDED,
              COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
            ],
          };
        } else if (status === 'Approved') {
          query.status = COMPLAINT_STATUS.APPROVED;
        } else if (status === 'Work in Progress') {
          query.status = COMPLAINT_STATUS.WORK_IN_PROGRESS;
        } else if (status === 'Completed') {
          query.status = COMPLAINT_STATUS.COMPLETED;
        } else if (status === 'Rejected') {
          query.status = COMPLAINT_STATUS.REJECTED;
        } else {
          query.status = status;
        }
      }

      const total = await Complaint.countDocuments(query);
      const items = await Complaint.find(query)
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      // Map to citizen-safe items
      const safeItems = items.map((c) => ({
        _id: c._id,
        ticketNo: c.ticketNo,
        department: c.departmentId?.name || 'Municipal Department',
        description: c.description,
        imageUrl: c.imageUrl,
        location: c.location,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        internalStatus: c.status,
        status: CITIZEN_STATUS_MAP[c.status] || c.status,
        rejectionReason: c.status === COMPLAINT_STATUS.REJECTED ? c.rejectionReason : undefined,
        completionNote: c.status === COMPLAINT_STATUS.COMPLETED ? c.completionNote : undefined,
        completionImageUrl: c.status === COMPLAINT_STATUS.COMPLETED ? c.completionImageUrl : undefined,
      }));

      return sendPaginated(res, { items: safeItems, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Citizen Complaint Details & Timeline
   */
  static async getComplaintDetails(req, res) {
    try {
      const complaint = await Complaint.findOne({
        _id: req.params.id,
        citizenId: req.user._id,
      }).populate('departmentId', 'name');

      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found or unauthorized' }, 404);
      }

      // Fetch public complaint events for citizen timeline
      const events = await ComplaintEvent.find({
        complaintId: complaint._id,
      }).sort({ createdAt: 1 });

      // Transform timeline events to strictly safe public milestones
      const timeline = events.map((e) => {
        let label = 'Status Updated';
        if (e.toStatus === COMPLAINT_STATUS.SUBMITTED) label = 'Complaint Submitted';
        else if (e.toStatus === COMPLAINT_STATUS.VERIFICATION_NEEDED) label = 'Accepted by Department';
        else if (e.toStatus === COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS) label = 'Ground Verification In Progress';
        else if (e.toStatus === COMPLAINT_STATUS.APPROVED) label = 'Ground Verification Approved';
        else if (e.toStatus === COMPLAINT_STATUS.WORK_IN_PROGRESS) label = 'Work Started On-Site';
        else if (e.toStatus === COMPLAINT_STATUS.COMPLETED) label = 'Work Completed';
        else if (e.toStatus === COMPLAINT_STATUS.REJECTED) label = 'Complaint Rejected';

        return {
          _id: e._id,
          toStatus: e.toStatus,
          citizenStatus: CITIZEN_STATUS_MAP[e.toStatus] || e.toStatus,
          label,
          createdAt: e.createdAt,
          // Citizen only sees completion note or rejection reason, never internal staff discussion
          note: e.toStatus === COMPLAINT_STATUS.REJECTED ? complaint.rejectionReason : e.toStatus === COMPLAINT_STATUS.COMPLETED ? complaint.completionNote : undefined,
        };
      });

      const responseData = {
        _id: complaint._id,
        ticketNo: complaint.ticketNo,
        department: complaint.departmentId?.name || 'Department',
        departmentId: complaint.departmentId?._id,
        description: complaint.description,
        imageUrl: complaint.imageUrl,
        location: complaint.location,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        internalStatus: complaint.status,
        status: CITIZEN_STATUS_MAP[complaint.status] || complaint.status,
        rejectionReason: complaint.status === COMPLAINT_STATUS.REJECTED ? complaint.rejectionReason : undefined,
        completionNote: complaint.status === COMPLAINT_STATUS.COMPLETED ? complaint.completionNote : undefined,
        completionImageUrl: complaint.status === COMPLAINT_STATUS.COMPLETED ? complaint.completionImageUrl : undefined,
        timeline,
      };

      return sendSuccess(res, responseData);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Citizen Dashboard Statistics
   */
  static async getCitizenStats(req, res) {
    try {
      const citizenId = req.user._id;

      const [total, pending, approved, inProgress, completed, rejected, recent] = await Promise.all([
        Complaint.countDocuments({ citizenId }),
        Complaint.countDocuments({
          citizenId,
          status: {
            $in: [
              COMPLAINT_STATUS.SUBMITTED,
              COMPLAINT_STATUS.VERIFICATION_NEEDED,
              COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
            ],
          },
        }),
        Complaint.countDocuments({ citizenId, status: COMPLAINT_STATUS.APPROVED }),
        Complaint.countDocuments({ citizenId, status: COMPLAINT_STATUS.WORK_IN_PROGRESS }),
        Complaint.countDocuments({ citizenId, status: COMPLAINT_STATUS.COMPLETED }),
        Complaint.countDocuments({ citizenId, status: COMPLAINT_STATUS.REJECTED }),
        Complaint.find({ citizenId })
          .populate('departmentId', 'name')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      const safeRecent = recent.map((c) => ({
        _id: c._id,
        ticketNo: c.ticketNo,
        department: c.departmentId?.name || 'Department',
        description: c.description,
        imageUrl: c.imageUrl,
        createdAt: c.createdAt,
        status: CITIZEN_STATUS_MAP[c.status] || c.status,
      }));

      return sendSuccess(res, {
        total,
        pending,
        approved,
        inProgress,
        completed,
        rejected,
        recent: safeRecent,
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Citizen Notifications
   */
  static async getNotifications(req, res) {
    try {
      const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);
      return sendSuccess(res, notifications);
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  static async markNotificationRead(req, res) {
    try {
      await Notification.updateOne(
        { _id: req.params.id, userId: req.user._id },
        { $set: { isRead: true } }
      );
      return sendSuccess(res, { message: 'Marked as read' });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  static async markAllNotificationsRead(req, res) {
    try {
      await Notification.updateMany({ userId: req.user._id }, { $set: { isRead: true } });
      return sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }
}
