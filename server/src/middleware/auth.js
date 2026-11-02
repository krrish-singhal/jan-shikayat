import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { sendError } from '../utils/response.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'Authentication required. No token provided.' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return sendError(res, { code: 'TOKEN_EXPIRED', message: 'Access token expired or invalid' }, 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) {
      return sendError(res, { code: 'USER_NOT_FOUND', message: 'User account not found or deleted' }, 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, { code: 'AUTH_ERROR', message: error.message }, 500);
  }
}

export function requireActiveAccount(req, res, next) {
  if (!req.user) {
    return sendError(res, { code: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  if (req.user.isBlocked) {
    return sendError(
      res,
      {
        code: 'ACCOUNT_BLOCKED',
        message: `Account is blocked. Reason: ${req.user.blockReason || 'Violation of municipal service terms'}`,
      },
      403
    );
  }

  if (!req.user.isActive) {
    return sendError(res, { code: 'ACCOUNT_DEACTIVATED', message: 'Staff account has been deactivated by Admin' }, 403);
  }

  next();
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { code: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        },
        403
      );
    }

    next();
  };
}

export function requireDepartment(req, res, next) {
  if (!req.user.departmentId) {
    return sendError(res, { code: 'NO_DEPARTMENT', message: 'User has no department assigned' }, 403);
  }
  next();
}

export async function requireAssignedEngineer(req, res, next) {
  try {
    const complaintId = req.params.id;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return sendError(res, { code: 'NOT_FOUND', message: 'Complaint not found' }, 404);
    }

    if (String(complaint.assignedEngineerId) !== String(req.user._id)) {
      return sendError(res, { code: 'FORBIDDEN', message: 'Only the assigned engineer can perform this action' }, 403);
    }

    req.complaint = complaint;
    next();
  } catch (err) {
    return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
  }
}
