import crypto from 'crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { PasswordReset } from '../models/PasswordReset.js';
import { Notification } from '../models/Notification.js';
import { ROLES, STAFF_ROLES } from '../constants/roles.js';
import {
  generateAccessToken,
  generateRandomToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../utils/token.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { NotificationService } from '../services/notificationService.js';

export class AuthController {
  /**
   * Citizen Registration
   */
  static async registerCitizen(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      const existing = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
      if (existing) {
        return sendError(res, { code: 'EMAIL_IN_USE', message: 'An account with this email already exists' }, 409);
      }

      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || '',
        role: ROLES.CITIZEN,
      });

      const accessToken = generateAccessToken(user);
      const rawRefreshToken = generateRandomToken();
      const tokenHash = hashToken(rawRefreshToken);
      const familyId = crypto.randomUUID();

      await RefreshToken.create({
        userId: user._id,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      setRefreshTokenCookie(res, rawRefreshToken);

      return sendSuccess(
        res,
        {
          user: user.toJSON(),
          accessToken,
        },
        201
      );
    } catch (err) {
      return sendError(res, { code: 'REGISTRATION_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Citizen Login (Email + Password)
   */
  static async loginCitizen(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase(), role: ROLES.CITIZEN, isDeleted: false });

      if (!user) {
        return sendError(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, 401);
      }

      if (user.isBlocked) {
        return sendError(res, { code: 'ACCOUNT_BLOCKED', message: `Account is blocked. Reason: ${user.blockReason || 'Terms violation'}` }, 403);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return sendError(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, 401);
      }

      const accessToken = generateAccessToken(user);
      const rawRefreshToken = generateRandomToken();
      const tokenHash = hashToken(rawRefreshToken);
      const familyId = crypto.randomUUID();

      await RefreshToken.create({
        userId: user._id,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      setRefreshTokenCookie(res, rawRefreshToken);

      return sendSuccess(res, {
        user: user.toJSON(),
        accessToken,
      });
    } catch (err) {
      return sendError(res, { code: 'LOGIN_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Staff Login (Staff ID or Email + Password)
   */
  static async loginStaff(req, res) {
    try {
      const { identifier, password } = req.body;
      const trimmedIdentifier = identifier.trim();

      // Search by either staffId (uppercase) or email (lowercase)
      const query = {
        role: { $in: STAFF_ROLES },
        isDeleted: false,
        $or: [
          { staffId: trimmedIdentifier.toUpperCase() },
          { email: trimmedIdentifier.toLowerCase() },
        ],
      };

      const user = await User.findOne(query).populate('departmentId', 'name isActive');

      if (!user) {
        return sendError(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid Staff ID / Email or password' }, 401);
      }

      if (!user.isActive) {
        return sendError(res, { code: 'ACCOUNT_DEACTIVATED', message: 'Your staff account has been deactivated. Please contact an Administrator.' }, 403);
      }

      if (user.isBlocked) {
        return sendError(res, { code: 'ACCOUNT_BLOCKED', message: `Account is blocked. Reason: ${user.blockReason || 'Terms violation'}` }, 403);
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return sendError(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid Staff ID / Email or password' }, 401);
      }

      const accessToken = generateAccessToken(user);
      const rawRefreshToken = generateRandomToken();
      const tokenHash = hashToken(rawRefreshToken);
      const familyId = crypto.randomUUID();

      await RefreshToken.create({
        userId: user._id,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      setRefreshTokenCookie(res, rawRefreshToken);

      return sendSuccess(res, {
        user: user.toJSON(),
        accessToken,
        mustChangePassword: user.mustChangePassword,
      });
    } catch (err) {
      return sendError(res, { code: 'STAFF_LOGIN_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Refresh Token Rotation
   */
  static async refreshToken(req, res) {
    try {
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!rawToken) {
        return sendError(res, { code: 'NO_TOKEN', message: 'Refresh token missing' }, 401);
      }

      const incomingHash = hashToken(rawToken);
      const tokenRecord = await RefreshToken.findOne({ tokenHash: incomingHash });

      if (!tokenRecord) {
        return sendError(res, { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }, 401);
      }

      // Check if token was already revoked (potential token reuse attack)
      if (tokenRecord.revokedAt) {
        // Invalidate entire family as a precaution
        await RefreshToken.updateMany({ familyId: tokenRecord.familyId }, { $set: { revokedAt: new Date() } });
        clearRefreshTokenCookie(res);
        return sendError(res, { code: 'TOKEN_REUSE_DETECTED', message: 'Refresh token was already used. Please login again.' }, 403);
      }

      // Check expiration
      if (tokenRecord.expiresAt < new Date()) {
        clearRefreshTokenCookie(res);
        return sendError(res, { code: 'TOKEN_EXPIRED', message: 'Refresh token expired' }, 401);
      }

      const user = await User.findById(tokenRecord.userId).populate('departmentId', 'name isActive');
      if (!user || user.isDeleted || !user.isActive || user.isBlocked) {
        clearRefreshTokenCookie(res);
        return sendError(res, { code: 'ACCOUNT_INVALID', message: 'Account is no longer active' }, 401);
      }

      // Rotate: Revoke old token and issue new token in same family
      tokenRecord.revokedAt = new Date();
      await tokenRecord.save();

      const newRawToken = generateRandomToken();
      const newHash = hashToken(newRawToken);

      await RefreshToken.create({
        userId: user._id,
        tokenHash: newHash,
        familyId: tokenRecord.familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const accessToken = generateAccessToken(user);
      setRefreshTokenCookie(res, newRawToken);

      return sendSuccess(res, {
        accessToken,
        user: user.toJSON(),
      });
    } catch (err) {
      return sendError(res, { code: 'REFRESH_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Logout (Revoke refresh tokens and clear cookie)
   */
  static async logout(req, res) {
    try {
      const rawToken = req.cookies?.refreshToken;
      if (rawToken) {
        const tokenHash = hashToken(rawToken);
        await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
      }
      clearRefreshTokenCookie(res);
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      return sendError(res, { code: 'LOGOUT_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Forgot Password
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });

      // Return success even if email not found to prevent user enumeration
      if (!user) {
        return sendSuccess(res, { message: 'If this email is registered, a password reset link has been dispatched.' });
      }

      const rawResetToken = generateRandomToken();
      const tokenHash = hashToken(rawResetToken);

      await PasswordReset.create({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${rawResetToken}`;

      NotificationService.sendPasswordResetEmail(user, resetUrl).catch((err) => {
        console.error('[Reset Email Error]', err.message);
      });

      return sendSuccess(res, {
        message: 'If this email is registered, a password reset link has been dispatched.',
        // Dev aid: include token in dev environment for easy testing
        devToken: process.env.NODE_ENV !== 'production' ? rawResetToken : undefined,
      });
    } catch (err) {
      return sendError(res, { code: 'FORGOT_PASSWORD_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Reset Password
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      const tokenHash = hashToken(token);

      const resetRecord = await PasswordReset.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
        usedAt: null,
      });

      if (!resetRecord) {
        return sendError(res, { code: 'INVALID_TOKEN', message: 'Reset token is invalid or has expired' }, 400);
      }

      const user = await User.findById(resetRecord.userId);
      if (!user || user.isDeleted) {
        return sendError(res, { code: 'USER_NOT_FOUND', message: 'User not found' }, 404);
      }

      user.passwordHash = await User.hashPassword(newPassword);
      user.mustChangePassword = false;
      await user.save();

      resetRecord.usedAt = new Date();
      await resetRecord.save();

      // Revoke all existing refresh tokens for security
      await RefreshToken.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });

      return sendSuccess(res, { message: 'Password has been reset successfully. Please log in with your new password.' });
    } catch (err) {
      return sendError(res, { code: 'RESET_PASSWORD_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Get Current Authenticated User (/me)
   */
  static async getMe(req, res) {
    try {
      const user = await User.findById(req.user._id).populate('departmentId', 'name isActive');
      if (!user) {
        return sendError(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
      }

      const unreadNotifications = await Notification.countDocuments({
        userId: user._id,
        isRead: false,
      });

      return sendSuccess(res, {
        user: user.toJSON(),
        unreadNotifications,
      });
    } catch (err) {
      return sendError(res, { code: 'SERVER_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Update Profile (Name & Phone)
   */
  static async updateProfile(req, res) {
    try {
      const { name, phone } = req.body;
      const user = await User.findById(req.user._id);

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;

      await user.save();
      return sendSuccess(res, { user: user.toJSON(), message: 'Profile updated successfully' });
    } catch (err) {
      return sendError(res, { code: 'UPDATE_PROFILE_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Change Password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return sendError(res, { code: 'INVALID_PASSWORD', message: 'Current password does not match' }, 400);
      }

      user.passwordHash = await User.hashPassword(newPassword);
      user.mustChangePassword = false;
      await user.save();

      // Invalidate existing refresh tokens
      await RefreshToken.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });

      return sendSuccess(res, { message: 'Password updated successfully' });
    } catch (err) {
      return sendError(res, { code: 'CHANGE_PASSWORD_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Delete / Anonymize Citizen Account
   * Requirement: Use account anonymization rather than physically deleting municipal complaint records.
   */
  static async deleteAccount(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return sendError(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
      }

      if (user.role !== ROLES.CITIZEN) {
        return sendError(res, { code: 'FORBIDDEN', message: 'Staff accounts cannot be deleted through this endpoint.' }, 403);
      }

      // Anonymize personal details
      const anonymizedId = user._id.toString();
      user.name = 'Anonymized Citizen';
      user.email = `deleted_${anonymizedId}@anonymized.local`;
      user.phone = '';
      user.passwordHash = 'ANONYMIZED';
      user.googleId = undefined;
      user.isDeleted = true;
      user.deletedAt = new Date();
      await user.save();

      // Invalidate refresh tokens
      await RefreshToken.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });
      clearRefreshTokenCookie(res);

      return sendSuccess(res, { message: 'Account has been successfully anonymized and deleted.' });
    } catch (err) {
      return sendError(res, { code: 'DELETE_ACCOUNT_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Google OAuth Callback / Exchange (supports direct token or callback code)
   */
  static async googleAuth(req, res) {
    try {
      const { email, name, googleId } = req.body;
      if (!email || !googleId) {
        return sendError(res, { code: 'VALIDATION_ERROR', message: 'Email and Google ID are required' }, 400);
      }

      let user = await User.findOne({
        $or: [{ googleId }, { email: email.toLowerCase() }],
        isDeleted: false,
      });

      if (!user) {
        user = await User.create({
          name: name || 'Google Citizen',
          email: email.toLowerCase(),
          googleId,
          role: ROLES.CITIZEN,
        });
      } else {
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      }

      if (user.isBlocked) {
        return sendError(res, { code: 'ACCOUNT_BLOCKED', message: `Account is blocked. Reason: ${user.blockReason || 'Terms violation'}` }, 403);
      }

      const accessToken = generateAccessToken(user);
      const rawRefreshToken = generateRandomToken();
      const tokenHash = hashToken(rawRefreshToken);
      const familyId = crypto.randomUUID();

      await RefreshToken.create({
        userId: user._id,
        tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      setRefreshTokenCookie(res, rawRefreshToken);

      return sendSuccess(res, {
        user: user.toJSON(),
        accessToken,
      });
    } catch (err) {
      return sendError(res, { code: 'GOOGLE_AUTH_ERROR', message: err.message }, 500);
    }
  }
}
