import { Complaint } from '../models/Complaint.js';
import { ComplaintEvent } from '../models/ComplaintEvent.js';
import { Department } from '../models/Department.js';
import { COMPLAINT_STATUS, COMPLAINT_ACTIONS, ENGINEER_ACTIVE_STATUSES } from '../constants/complaintStatus.js';
import { applyTransition, getEngineerActiveCaseCount } from '../services/complaintStateMachine.js';
import { UploadService } from '../services/uploadService.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

export class EngineerController {
  /**
   * Engineer Capacity Status
   */
  static async getCapacity(req, res) {
    try {
      const engineerId = req.user._id;
      const maxCapacity = req.user.maxActiveCases || 5;
      const activeCases = await getEngineerActiveCaseCount(engineerId, Complaint);
      const availableCapacity = Math.max(0, maxCapacity - activeCases);

      return sendSuccess(res, {
        maxActiveCases: maxCapacity,
        activeCases,
        availableCapacity,
        isAtCapacity: activeCases >= maxCapacity,
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Engineer Dashboard Statistics
   */
  static async getDashboardStats(req, res) {
    try {
      const engineerId = req.user._id;
      const departmentId = req.user.departmentId;
      const maxCapacity = req.user.maxActiveCases || 5;

      const [
        verificationNeededCount,
        verifyingCount,
        approvedPendingWorkCount,
        inProgressCount,
        completedCount,
        department,
      ] = await Promise.all([
        Complaint.countDocuments({ departmentId, status: COMPLAINT_STATUS.VERIFICATION_NEEDED }),
        Complaint.countDocuments({ assignedEngineerId: engineerId, status: COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS }),
        Complaint.countDocuments({ assignedEngineerId: engineerId, status: COMPLAINT_STATUS.APPROVED }),
        Complaint.countDocuments({ assignedEngineerId: engineerId, status: COMPLAINT_STATUS.WORK_IN_PROGRESS }),
        Complaint.countDocuments({ assignedEngineerId: engineerId, status: COMPLAINT_STATUS.COMPLETED }),
        Department.findById(departmentId).select('name description isActive'),
      ]);

      const activeCases = verifyingCount + approvedPendingWorkCount + inProgressCount;
      const availableCapacity = Math.max(0, maxCapacity - activeCases);

      return sendSuccess(res, {
        department,
        verificationNeededCount,
        verifyingCount,
        approvedPendingWorkCount,
        inProgressCount,
        completedCount,
        activeCases,
        maxActiveCases: maxCapacity,
        availableCapacity,
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Verification Needed Queue
   * Complaints in engineer's department needing pickup (FIFO).
   */
  static async getVerificationQueue(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const departmentId = req.user.departmentId;

      const query = {
        departmentId,
        status: COMPLAINT_STATUS.VERIFICATION_NEEDED,
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
        .sort({ createdAt: 1 }) // FIFO
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * My Assigned Cases (with tab filtering: VERIFYING, APPROVED, IN_PROGRESS, COMPLETED)
   */
  static async getMyCases(req, res) {
    try {
      const { page = 1, limit = 10, tab = 'VERIFYING', search = '' } = req.query;
      const engineerId = req.user._id;

      const query = { assignedEngineerId: engineerId };

      if (tab === 'VERIFYING') {
        query.status = COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS;
      } else if (tab === 'APPROVED') {
        query.status = COMPLAINT_STATUS.APPROVED;
      } else if (tab === 'IN_PROGRESS') {
        query.status = COMPLAINT_STATUS.WORK_IN_PROGRESS;
      } else if (tab === 'COMPLETED') {
        query.status = COMPLAINT_STATUS.COMPLETED;
      }

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
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

      return sendPaginated(res, { items, page, limit, total });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Engineer Complaint Details
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
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found or belongs to another department' }, 404);
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
   * Pick Up Complaint (Atomic check & assignment)
   */
  static async pickupComplaint(req, res) {
    try {
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.PICKUP, req.user);
      return sendSuccess(res, { complaint, message: 'Complaint picked up successfully.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Release Complaint back to queue
   */
  static async releaseComplaint(req, res) {
    try {
      const { reason } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.RELEASE, req.user, { reason });
      return sendSuccess(res, { complaint, message: 'Case released back to department queue.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Deny Ground Verification
   */
  static async denyComplaint(req, res) {
    try {
      const { rejectionReason } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.DENY, req.user, { rejectionReason });
      return sendSuccess(res, { complaint, message: 'Complaint denied following ground inspection.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Approve Ground Verification
   */
  static async approveComplaint(req, res) {
    try {
      const { note } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.APPROVE, req.user, { note });
      return sendSuccess(res, { complaint, message: 'Ground verification approved. Work pending.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Start Work On-Site
   */
  static async startWork(req, res) {
    try {
      const { note } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.START_WORK, req.user, { note });
      return sendSuccess(res, { complaint, message: 'Work initiated successfully.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }

  /**
   * Complete Work (with completion note and optional completion photograph)
   */
  static async completeWork(req, res) {
    try {
      const { completionNote } = req.body;
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
      }

      let completionImageUrl = '';
      if (req.file) {
        completionImageUrl = await UploadService.uploadImage(req.file, 'completions');
      }

      await applyTransition(complaint, COMPLAINT_ACTIONS.COMPLETE_WORK, req.user, {
        completionNote,
        completionImageUrl,
      });

      return sendSuccess(res, { complaint, message: 'Complaint marked as completed.' });
    } catch (err) {
      return sendError(res, { code: err.code || 'ACTION_ERROR', message: err.message }, err.statusCode || 400);
    }
  }
}
