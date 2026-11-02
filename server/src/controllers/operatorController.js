import { Complaint } from '../models/Complaint.js';
import { ComplaintEvent } from '../models/ComplaintEvent.js';
import { Department } from '../models/Department.js';
import { COMPLAINT_STATUS, COMPLAINT_ACTIONS } from '../constants/complaintStatus.js';
import { applyTransition } from '../services/complaintStateMachine.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

export class OperatorController {
  /**
   * Operator Dashboard Statistics
   */
  static async getDashboardStats(req, res) {
    try {
      const departmentId = req.user.departmentId;
      const operatorId = req.user._id;

      const [totalIncoming, accepted, rejected, forwarded, recentHandled, department] = await Promise.all([
        Complaint.countDocuments({ departmentId, status: COMPLAINT_STATUS.SUBMITTED }),
        ComplaintEvent.countDocuments({ actorId: operatorId, action: COMPLAINT_ACTIONS.ACCEPT }),
        ComplaintEvent.countDocuments({ actorId: operatorId, action: COMPLAINT_ACTIONS.REJECT }),
        ComplaintEvent.countDocuments({ actorId: operatorId, action: COMPLAINT_ACTIONS.FORWARD }),
        ComplaintEvent.find({ actorId: operatorId })
          .populate({
            path: 'complaintId',
            populate: [{ path: 'citizenId', select: 'name phone email' }, { path: 'departmentId', select: 'name' }],
          })
          .sort({ createdAt: -1 })
          .limit(5),
        Department.findById(departmentId).select('name description isActive'),
      ]);

      return sendSuccess(res, {
        department,
        totalIncoming,
        pendingReview: totalIncoming,
        accepted,
        rejected,
        forwarded,
        recentHandled: recentHandled
          .filter((e) => e.complaintId)
          .map((e) => ({
            _id: e._id,
            complaintId: e.complaintId._id,
            ticketNo: e.complaintId.ticketNo,
            citizenName: e.complaintId.citizenId?.name || 'Citizen',
            action: e.action,
            currentStatus: e.complaintId.status,
            actionDate: e.createdAt,
            note: e.note,
          })),
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Operator Incoming Complaints Queue (FIFO)
   * Enforces department isolation: only complaints in operator's department with SUBMITTED status.
   */
  static async getIncomingQueue(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const departmentId = req.user.departmentId;

      const query = {
        departmentId,
        status: COMPLAINT_STATUS.SUBMITTED,
      };

      if (search) {
        query.$or = [
          { ticketNo: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const total = await Complaint.countDocuments(query);
      const items = await Complaint.find(query)
        .populate('citizenId', 'name phone email')
        .populate('departmentId', 'name')
        .sort({ createdAt: 1 }) // FIFO: oldest first
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Operator Complaint Details
   */
  static async getComplaintDetail(req, res) {
    try {
      const departmentId = req.user.departmentId;
      const complaint = await Complaint.findOne({
        _id: req.params.id,
        departmentId,
      })
        .populate('citizenId', 'name phone email')
        .populate('departmentId', 'name')
        .populate('assignedEngineerId', 'name staffId phone email');

      if (!complaint) {
        return sendError(
          res,
          {
            code: 'NOT_FOUND',
            message: 'Complaint not found or does not belong to your assigned department',
          },
          404
        );
      }

      const events = await ComplaintEvent.find({ complaintId: complaint._id })
        .populate('actorId', 'name role staffId')
        .sort({ createdAt: 1 });

      return sendSuccess(res, { complaint, events });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Accept Complaint -> moves to VERIFICATION_NEEDED
   */
  static async acceptComplaint(req, res) {
    try {
      const { note } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.ACCEPT, req.user, { note });
      return sendSuccess(res, { complaint, message: 'Complaint accepted for ground verification.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Reject Complaint -> moves to REJECTED
   */
  static async rejectComplaint(req, res) {
    try {
      const { rejectionReason } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.REJECT, req.user, { rejectionReason });
      return sendSuccess(res, { complaint, message: 'Complaint rejected successfully.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Forward Complaint -> updates departmentId, remains SUBMITTED, increments forwardCount
   */
  static async forwardComplaint(req, res) {
    try {
      const { targetDepartmentId, note } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.FORWARD, req.user, { targetDepartmentId, note });
      return sendSuccess(res, {
        complaint,
        message: 'Complaint forwarded to destination department successfully.',
      });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Operator Complaint Action History
   * Lists actions performed by the logged-in operator.
   */
  static async getComplaintHistory(req, res) {
    try {
      const { page = 1, limit = 10, action = '' } = req.query;
      const query = { actorId: req.user._id };

      if (action) {
        query.action = action;
      }

      const total = await ComplaintEvent.countDocuments(query);
      const events = await ComplaintEvent.find(query)
        .populate({
          path: 'complaintId',
          populate: [
            { path: 'citizenId', select: 'name phone email' },
            { path: 'departmentId', select: 'name' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      const items = events
        .filter((e) => e.complaintId)
        .map((e) => ({
          _id: e._id,
          complaintId: e.complaintId._id,
          ticketNo: e.complaintId.ticketNo,
          action: e.action,
          currentStatus: e.complaintId.status,
          department: e.complaintId.departmentId?.name || 'Department',
          citizenName: e.complaintId.citizenId?.name || 'Citizen',
          actionDate: e.createdAt,
          note: e.note,
          metadata: e.metadata,
        }));

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }
}
