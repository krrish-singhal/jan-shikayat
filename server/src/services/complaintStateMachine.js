import { COMPLAINT_STATUS, COMPLAINT_ACTIONS, TERMINAL_STATUSES, ENGINEER_ACTIVE_STATUSES } from '../constants/complaintStatus.js';
import { ROLES } from '../constants/roles.js';
import { ComplaintEvent } from '../models/ComplaintEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { NotificationService } from './notificationService.js';

export class StateMachineError extends Error {
  constructor(message, statusCode = 400, code = 'INVALID_TRANSITION') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Calculates current active case count for an engineer.
 */
export async function getEngineerActiveCaseCount(engineerId, ComplaintModel) {
  return await ComplaintModel.countDocuments({
    assignedEngineerId: engineerId,
    status: { $in: ENGINEER_ACTIVE_STATUSES },
  });
}

/**
 * Validates and applies a transition to a complaint.
 *
 * @param {Object} complaint - Mongoose Complaint document
 * @param {string} action - One of COMPLAINT_ACTIONS
 * @param {Object} actor - Authenticated user object ({ _id, role, departmentId, name })
 * @param {Object} payload - Action-specific payload (notes, reasons, destination department, completion data, etc.)
 * @returns {Promise<Object>} Updated complaint
 */
export async function applyTransition(complaint, action, actor, payload = {}) {
  const currentStatus = complaint.status;
  const ComplaintModel = complaint.constructor;
  let targetStatus = currentStatus;
  let eventNote = payload.note || '';
  let metadata = {};
  let isAdminOverride = false;

  // 1. ADMIN OVERRIDE
  if (actor.role === ROLES.ADMIN && action === COMPLAINT_ACTIONS.ADMIN_OVERRIDE) {
    isAdminOverride = true;
    if (!payload.targetStatus || !Object.values(COMPLAINT_STATUS).includes(payload.targetStatus)) {
      throw new StateMachineError('Valid target status is required for admin override', 400, 'VALIDATION_ERROR');
    }
    if (!payload.explanation || payload.explanation.trim().length < 5) {
      throw new StateMachineError('A detailed explanation (min 5 characters) is required for admin override', 400, 'VALIDATION_ERROR');
    }

    targetStatus = payload.targetStatus;
    eventNote = payload.explanation;
    metadata = {
      explanation: payload.explanation,
      previousStatus: currentStatus,
      previousEngineer: complaint.assignedEngineerId,
    };

    // If overridden to a non-active engineer status, clear assigned engineer if appropriate
    if (!ENGINEER_ACTIVE_STATUSES.includes(targetStatus)) {
      complaint.assignedEngineerId = null;
    }

    complaint.status = targetStatus;
    await complaint.save();

    await ComplaintEvent.create({
      complaintId: complaint._id,
      actorId: actor._id,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      action: COMPLAINT_ACTIONS.ADMIN_OVERRIDE,
      note: eventNote,
      isAdminOverride: true,
      metadata,
    });

    await AuditLog.create({
      actorId: actor._id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ADMIN_STATUS_OVERRIDE',
      complaintId: complaint._id,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      notes: payload.explanation,
      isAdminOverride: true,
      metadata,
    });

    NotificationService.notifyStatusChange(complaint, targetStatus, actor, eventNote).catch(() => {});
    return complaint;
  }

  // 2. CHECK TERMINAL STATUS FOR NON-ADMINS
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    throw new StateMachineError(
      `Cannot perform action on a terminal complaint with status '${currentStatus}'. Only Admin override can modify terminal complaints.`,
      409,
      'TERMINAL_STATUS'
    );
  }

  // 3. TRANSITION MATRIX VALIDATION
  switch (action) {
    // --- OPERATOR ACTIONS ---
    case COMPLAINT_ACTIONS.ACCEPT: {
      if (actor.role !== ROLES.OPERATOR) {
        throw new StateMachineError('Only an Operator can accept complaints', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.SUBMITTED) {
        throw new StateMachineError(`Cannot accept complaint in '${currentStatus}' status. Must be SUBMITTED.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.departmentId) !== String(actor.departmentId)) {
        throw new StateMachineError('Operator can only accept complaints belonging to their assigned department', 403, 'DEPARTMENT_MISMATCH');
      }

      targetStatus = COMPLAINT_STATUS.VERIFICATION_NEEDED;
      eventNote = payload.note || 'Complaint accepted for ground verification';
      complaint.status = targetStatus;
      await complaint.save();
      break;
    }

    case COMPLAINT_ACTIONS.REJECT: {
      if (actor.role !== ROLES.OPERATOR) {
        throw new StateMachineError('Only an Operator can reject complaints at this stage', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.SUBMITTED) {
        throw new StateMachineError(`Cannot reject complaint in '${currentStatus}' status. Must be SUBMITTED.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.departmentId) !== String(actor.departmentId)) {
        throw new StateMachineError('Operator can only reject complaints belonging to their assigned department', 403, 'DEPARTMENT_MISMATCH');
      }
      if (!payload.rejectionReason || payload.rejectionReason.trim().length < 5) {
        throw new StateMachineError('Rejection reason is mandatory (minimum 5 characters)', 400, 'VALIDATION_ERROR');
      }

      targetStatus = COMPLAINT_STATUS.REJECTED;
      complaint.status = targetStatus;
      complaint.rejectionReason = payload.rejectionReason.trim();
      eventNote = `Rejected by Operator: ${complaint.rejectionReason}`;
      metadata = { rejectionReason: complaint.rejectionReason };
      await complaint.save();
      break;
    }

    case COMPLAINT_ACTIONS.FORWARD: {
      if (actor.role !== ROLES.OPERATOR) {
        throw new StateMachineError('Only an Operator can forward complaints', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.SUBMITTED) {
        throw new StateMachineError(`Cannot forward complaint in '${currentStatus}' status. Must be SUBMITTED.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.departmentId) !== String(actor.departmentId)) {
        throw new StateMachineError('Operator can only forward complaints belonging to their assigned department', 403, 'DEPARTMENT_MISMATCH');
      }
      if (!payload.targetDepartmentId) {
        throw new StateMachineError('Target department is required for forwarding', 400, 'VALIDATION_ERROR');
      }
      if (String(payload.targetDepartmentId) === String(complaint.departmentId)) {
        throw new StateMachineError('Cannot forward to the same department', 400, 'VALIDATION_ERROR');
      }

      const destDept = await Department.findOne({ _id: payload.targetDepartmentId, isActive: true });
      if (!destDept) {
        throw new StateMachineError('Destination department not found or inactive', 404, 'NOT_FOUND');
      }

      const oldDepartmentId = complaint.departmentId;
      complaint.departmentId = destDept._id;
      complaint.forwardCount = (complaint.forwardCount || 0) + 1;
      if (complaint.forwardCount > 3) {
        complaint.isForwardFlagged = true;
      }
      // Status remains SUBMITTED
      targetStatus = COMPLAINT_STATUS.SUBMITTED;
      eventNote = payload.note ? `Forwarded to ${destDept.name}: ${payload.note}` : `Forwarded to ${destDept.name}`;
      metadata = {
        oldDepartmentId,
        newDepartmentId: destDept._id,
        forwardCount: complaint.forwardCount,
        note: payload.note || '',
      };

      await complaint.save();
      break;
    }

    // --- ENGINEER ACTIONS ---
    case COMPLAINT_ACTIONS.PICKUP: {
      if (actor.role !== ROLES.ENGINEER) {
        throw new StateMachineError('Only an Engineer can pick up complaints', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.VERIFICATION_NEEDED) {
        throw new StateMachineError(`Complaint is not in VERIFICATION_NEEDED status (current: ${currentStatus})`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.departmentId) !== String(actor.departmentId)) {
        throw new StateMachineError('Engineer can only pick up complaints from their assigned department', 403, 'DEPARTMENT_MISMATCH');
      }

      // Check Engineer Capacity
      const activeCount = await getEngineerActiveCaseCount(actor._id, ComplaintModel);
      const maxCapacity = actor.maxActiveCases || 5;
      if (activeCount >= maxCapacity) {
        throw new StateMachineError(`Engineer capacity reached (${activeCount}/${maxCapacity} active cases)`, 422, 'CAPACITY_REACHED');
      }

      // Atomic pickup using conditional findOneAndUpdate
      const updated = await ComplaintModel.findOneAndUpdate(
        {
          _id: complaint._id,
          status: COMPLAINT_STATUS.VERIFICATION_NEEDED,
          assignedEngineerId: null,
        },
        {
          $set: {
            status: COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS,
            assignedEngineerId: actor._id,
          },
        },
        { new: true }
      );

      if (!updated) {
        throw new StateMachineError('Complaint was already picked up or modified by another user', 409, 'CONFLICT');
      }

      targetStatus = COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS;
      eventNote = 'Complaint picked up by Joint Engineer for ground verification';
      complaint.status = targetStatus;
      complaint.assignedEngineerId = actor._id;
      break;
    }

    case COMPLAINT_ACTIONS.RELEASE: {
      if (actor.role !== ROLES.ENGINEER) {
        throw new StateMachineError('Only an Engineer can release cases', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS) {
        throw new StateMachineError(`Cannot release complaint in '${currentStatus}' status. Must be VERIFICATION_IN_PROGRESS.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.assignedEngineerId) !== String(actor._id)) {
        throw new StateMachineError('Only the assigned engineer can release this case', 403, 'FORBIDDEN');
      }
      if (!payload.reason || payload.reason.trim().length < 5) {
        throw new StateMachineError('Release reason is mandatory (minimum 5 characters)', 400, 'VALIDATION_ERROR');
      }

      targetStatus = COMPLAINT_STATUS.VERIFICATION_NEEDED;
      eventNote = `Released by Engineer: ${payload.reason.trim()}`;
      metadata = {
        releaseReason: payload.reason.trim(),
        previousEngineer: complaint.assignedEngineerId,
      };

      complaint.status = targetStatus;
      complaint.assignedEngineerId = null;
      await complaint.save();
      break;
    }

    case COMPLAINT_ACTIONS.DENY: {
      if (actor.role !== ROLES.ENGINEER) {
        throw new StateMachineError('Only an Engineer can deny ground verification', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS) {
        throw new StateMachineError(`Cannot deny complaint in '${currentStatus}' status. Must be VERIFICATION_IN_PROGRESS.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.assignedEngineerId) !== String(actor._id)) {
        throw new StateMachineError('Only the assigned engineer can deny this verification', 403, 'FORBIDDEN');
      }
      if (!payload.rejectionReason || payload.rejectionReason.trim().length < 5) {
        throw new StateMachineError('Rejection reason is mandatory (minimum 5 characters)', 400, 'VALIDATION_ERROR');
      }

      targetStatus = COMPLAINT_STATUS.REJECTED;
      complaint.status = targetStatus;
      complaint.rejectionReason = payload.rejectionReason.trim();
      eventNote = `Denied after ground verification: ${complaint.rejectionReason}`;
      metadata = { rejectionReason: complaint.rejectionReason };
      await complaint.save();
      break;
    }

    case COMPLAINT_ACTIONS.APPROVE: {
      if (actor.role !== ROLES.ENGINEER) {
        throw new StateMachineError('Only an Engineer can approve ground verification', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS) {
        throw new StateMachineError(`Cannot approve complaint in '${currentStatus}' status. Must be VERIFICATION_IN_PROGRESS.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.assignedEngineerId) !== String(actor._id)) {
        throw new StateMachineError('Only the assigned engineer can approve this verification', 403, 'FORBIDDEN');
      }

      targetStatus = COMPLAINT_STATUS.APPROVED;
      eventNote = payload.note ? `Ground verification approved: ${payload.note}` : 'Ground verification approved. Work pending.';
      metadata = { note: payload.note || '' };
      complaint.status = targetStatus;
      await complaint.save();
      break;
    }

    case COMPLAINT_ACTIONS.START_WORK: {
      if (actor.role !== ROLES.ENGINEER) {
        throw new StateMachineError('Only an Engineer can start work', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.APPROVED) {
        throw new StateMachineError(`Cannot start work on complaint in '${currentStatus}' status. Must be APPROVED.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.assignedEngineerId) !== String(actor._id)) {
        throw new StateMachineError('Only the assigned engineer can start work on this case', 403, 'FORBIDDEN');
      }

      targetStatus = COMPLAINT_STATUS.WORK_IN_PROGRESS;
      eventNote = payload.note ? `Work started: ${payload.note}` : 'Municipal repair/work initiated on-site';
      metadata = { note: payload.note || '' };
      complaint.status = targetStatus;
      await complaint.save();
      break;
    }

    case COMPLAINT_ACTIONS.COMPLETE_WORK: {
      if (actor.role !== ROLES.ENGINEER) {
        throw new StateMachineError('Only an Engineer can complete work', 403, 'FORBIDDEN');
      }
      if (currentStatus !== COMPLAINT_STATUS.WORK_IN_PROGRESS) {
        throw new StateMachineError(`Cannot complete complaint in '${currentStatus}' status. Must be WORK_IN_PROGRESS.`, 409, 'INVALID_TRANSITION');
      }
      if (String(complaint.assignedEngineerId) !== String(actor._id)) {
        throw new StateMachineError('Only the assigned engineer can complete this case', 403, 'FORBIDDEN');
      }
      if (!payload.completionNote || payload.completionNote.trim().length < 5 || payload.completionNote.trim().length > 500) {
        throw new StateMachineError('Completion note is mandatory (between 5 and 500 characters)', 400, 'VALIDATION_ERROR');
      }

      targetStatus = COMPLAINT_STATUS.COMPLETED;
      complaint.status = targetStatus;
      complaint.completionNote = payload.completionNote.trim();
      if (payload.completionImageUrl) {
        complaint.completionImageUrl = payload.completionImageUrl;
      }
      eventNote = `Work Completed: ${complaint.completionNote}`;
      metadata = {
        completionNote: complaint.completionNote,
        completionImageUrl: complaint.completionImageUrl || null,
      };

      await complaint.save();
      break;
    }

    default:
      throw new StateMachineError(`Unsupported complaint action: '${action}'`, 400, 'UNKNOWN_ACTION');
  }

  // Record ComplaintEvent
  await ComplaintEvent.create({
    complaintId: complaint._id,
    actorId: actor._id,
    fromStatus: currentStatus,
    toStatus: targetStatus,
    action,
    note: eventNote,
    isAdminOverride: false,
    metadata,
  });

  // Record AuditLog
  await AuditLog.create({
    actorId: actor._id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    complaintId: complaint._id,
    previousStatus: currentStatus,
    newStatus: targetStatus,
    previousDepartment: metadata.oldDepartmentId ? String(metadata.oldDepartmentId) : null,
    newDepartment: metadata.newDepartmentId ? String(metadata.newDepartmentId) : null,
    assignedEngineer: complaint.assignedEngineerId ? String(complaint.assignedEngineerId) : null,
    notes: eventNote,
    isAdminOverride: false,
    metadata,
  });

  // Asynchronous Notification
  NotificationService.notifyStatusChange(complaint, targetStatus, actor, eventNote).catch((err) => {
    console.error('[NotificationService Error]', err.message);
  });

  return complaint;
}
