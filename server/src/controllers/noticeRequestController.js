import { NoticeRequest } from '../models/NoticeRequest.js';
import { Notice } from '../models/Notice.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';

// POST /api/v1/notice-requests
// OPERATOR or ENGINEER: submit a new notice request
export async function submitRequest(req, res) {
  try {
    const { title, reason, category } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: 'Title is required' }, 400);
    }

    const noticeRequest = await NoticeRequest.create({
      title: title.trim(),
      reason: reason ? reason.trim() : undefined,
      category: category || 'General',
      requestedBy: req.user._id,
    });

    // Notify all active ADMIN users about the new notice request
    try {
      const admins = await User.find({ role: 'ADMIN', isDeleted: false, isActive: true });
      const snippet = title.length > 50 ? title.substring(0, 50) + '...' : title;
      const notifPromises = admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          message: `Notice Request from ${req.user.name} (${req.user.role}): "${snippet}"`,
          type: 'INFO',
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error('[submitRequest] Failed to dispatch admin notifications:', notifErr);
    }

    return sendSuccess(res, { noticeRequest }, 201);
  } catch (err) {
    return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
}

// GET /api/v1/notice-requests/my
// OPERATOR or ENGINEER: get their own submitted requests
export async function getMyRequests(req, res) {
  try {
    const requests = await NoticeRequest.find({ requestedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('noticeId', 'title category date');

    return sendSuccess(res, { requests }, 200);
  } catch (err) {
    return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
}

// GET /api/v1/notice-requests/admin?status=pending|approved|rejected
// ADMIN: get all requests, optionally filtered by status
export async function getAdminRequests(req, res) {
  try {
    const filter = {};
    const { status } = req.query;

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await NoticeRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'name role staffId departmentId')
      .populate('noticeId', 'title category date')
      .populate('reviewedBy', 'name role');

    return sendSuccess(res, { requests }, 200);
  } catch (err) {
    return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
}

// GET /api/v1/notice-requests/admin/count
// ADMIN: returns count of pending notice requests (for badge)
export async function getAdminPendingCount(req, res) {
  try {
    const count = await NoticeRequest.countDocuments({ status: 'pending' });
    return sendSuccess(res, { count }, 200);
  } catch (err) {
    return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
}

// PATCH /api/v1/notice-requests/admin/:id
// ADMIN: approve or reject a notice request
export async function reviewRequest(req, res) {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return sendError(res, { code: 'VALIDATION_ERROR', message: "action must be 'approve' or 'reject'" }, 400);
    }

    const noticeRequest = await NoticeRequest.findById(id);
    if (!noticeRequest) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Notice request not found' }, 404);
    }

    if (noticeRequest.status !== 'pending') {
      return sendError(
        res,
        { code: 'ALREADY_REVIEWED', message: 'This notice request has already been reviewed' },
        400
      );
    }

    if (action === 'approve') {
      // Create a Notice from the request's title and category
      const notice = await Notice.create({
        title: noticeRequest.title,
        category: noticeRequest.category || 'General',
        createdBy: req.user._id,
      });

      noticeRequest.status = 'approved';
      noticeRequest.noticeId = notice._id;
      noticeRequest.adminNote = adminNote ? adminNote.trim() : undefined;
      noticeRequest.reviewedBy = req.user._id;
      noticeRequest.reviewedAt = new Date();
    } else {
      // reject
      noticeRequest.status = 'rejected';
      noticeRequest.adminNote = adminNote ? adminNote.trim() : undefined;
      noticeRequest.reviewedBy = req.user._id;
      noticeRequest.reviewedAt = new Date();
    }

    await noticeRequest.save();

    // Notify requester about the admin decision
    try {
      const snippet = noticeRequest.title.length > 40 ? noticeRequest.title.substring(0, 40) + '...' : noticeRequest.title;
      await Notification.create({
        userId: noticeRequest.requestedBy,
        message:
          action === 'approve'
            ? `Your notice request "${snippet}" was approved and published to the public notice board.`
            : `Your notice request "${snippet}" was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        type: action === 'approve' ? 'SUCCESS' : 'WARNING',
      });
    } catch (notifErr) {
      console.error('[reviewRequest] Failed to notify requester:', notifErr);
    }

    const updated = await NoticeRequest.findById(id)
      .populate('requestedBy', 'name role staffId departmentId')
      .populate('noticeId', 'title category date')
      .populate('reviewedBy', 'name role');

    return sendSuccess(res, { noticeRequest: updated }, 200);
  } catch (err) {
    return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
}
