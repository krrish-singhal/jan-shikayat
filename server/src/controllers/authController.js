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
          refreshToken: rawRefreshToken,
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
        refreshToken: rawRefreshToken,
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
        refreshToken: rawRefreshToken,
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
        refreshToken: newRawToken,
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
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
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
   * Check if Google user exists and whether phone is already provided
   */
  static async checkGoogleUser(req, res) {
    try {
      const { email, googleId } = req.body;
      if (!email && !googleId) {
        return sendError(res, { code: 'VALIDATION_ERROR', message: 'Email or Google ID is required' }, 400);
      }

      const query = { isDeleted: false, $or: [] };
      if (email) query.$or.push({ email: email.toLowerCase() });
      if (googleId) query.$or.push({ googleId });

      const user = await User.findOne(query);

      return sendSuccess(res, {
        exists: !!user,
        hasPhone: !!(user && user.phone && user.phone.trim().length > 0),
        phone: user?.phone || '',
        name: user?.name || '',
      });
    } catch (err) {
      return sendError(res, { code: 'CHECK_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Initiate Google OAuth 2.0 Web Redirect Flow
   * Forces account selection prompt ('prompt=select_account')
   */
  static async googleOAuthRedirect(req, res) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      if (!clientId) {
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Google Client ID is not configured on the server.')}`);
      }

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        callbackUrl
      )}&response_type=code&scope=openid%20email%20profile&prompt=select_account&access_type=offline`;

      return res.redirect(googleAuthUrl);
    } catch (err) {
      console.error('[Google OAuth Redirect Error]', err);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Failed to initiate Google authentication.')}`);
    }
  }

  /**
   * Handle Google OAuth 2.0 Web Callback with authorization code
   */
  static async googleOAuthCallback(req, res) {
    const { code, error } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (error || !code) {
      const errorMsg = error || 'Google sign-in was cancelled or denied.';
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(errorMsg)}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback';

    try {
      // 1. Exchange authorization code for Google access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('[Google Token Exchange Error]', tokenData);
        return res.redirect(
          `${clientUrl}/auth/callback?error=${encodeURIComponent(
            tokenData.error_description || 'Failed to exchange authorization code with Google'
          )}`
        );
      }

      // 2. Fetch authenticated profile from Google UserInfo endpoint
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile = await userRes.json();
      if (!userRes.ok || !profile.email) {
        return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent('Failed to retrieve user profile from Google')}`);
      }

      // 3. Find or create citizen in database
      let user = await User.findOne({
        $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }],
        isDeleted: false,
      });

      if (!user) {
        user = await User.create({
          name: profile.name || 'Google Citizen',
          email: profile.email.toLowerCase(),
          googleId: profile.sub,
          role: ROLES.CITIZEN,
          phone: '',
        });
      } else {
        let changed = false;
        if (!user.googleId) {
          user.googleId = profile.sub;
          changed = true;
        }
        if (profile.name && (!user.name || user.name === 'Google Citizen')) {
          user.name = profile.name;
          changed = true;
        }
        if (changed) {
          await user.save();
        }
      }

      if (user.isBlocked) {
        return res.redirect(
          `${clientUrl}/auth/callback?error=${encodeURIComponent(
            `Account is blocked. Reason: ${user.blockReason || 'Terms violation'}`
          )}`
        );
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

      return res.redirect(`${clientUrl}/auth/callback?token=${accessToken}&refreshToken=${rawRefreshToken}`);
    } catch (err) {
      console.error('[Google OAuth Callback Exception]', err);
      return res.redirect(`${clientUrl}/auth/callback?error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * Exchange Google authorization code via REST POST (for SPA client direct code handling)
   */
  static async googleExchangeCode(req, res) {
    try {
      const { code, redirectUri } = req.body;
      if (!code) {
        return sendError(res, { code: 'VALIDATION_ERROR', message: 'Authorization code is required' }, 400);
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const callbackUrl = redirectUri || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback';

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return sendError(res, { code: 'TOKEN_EXCHANGE_FAILED', message: tokenData.error_description || 'Failed to exchange authorization code' }, 400);
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile = await userRes.json();
      if (!userRes.ok || !profile.email) {
        return sendError(res, { code: 'PROFILE_FETCH_FAILED', message: 'Failed to retrieve profile from Google' }, 400);
      }

      let user = await User.findOne({
        $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }],
        isDeleted: false,
      });

      if (!user) {
        user = await User.create({
          name: profile.name || 'Google Citizen',
          email: profile.email.toLowerCase(),
          googleId: profile.sub,
          role: ROLES.CITIZEN,
          phone: '',
        });
      } else {
        let changed = false;
        if (!user.googleId) {
          user.googleId = profile.sub;
          changed = true;
        }
        if (profile.name && (!user.name || user.name === 'Google Citizen')) {
          user.name = profile.name;
          changed = true;
        }
        if (changed) {
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
        refreshToken: rawRefreshToken,
      });
    } catch (err) {
      return sendError(res, { code: 'EXCHANGE_ERROR', message: err.message }, 500);
    }
  }

  /**
   * Google OAuth Callback / Exchange (supports direct token or profile payload)
   */
  static async googleAuth(req, res) {
    try {
      let { email, name, googleId, phone, accessToken } = req.body;

      // If an access token from Google Identity Services is provided, verify against Google userinfo
      if (accessToken) {
        try {
          const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (googleRes.ok) {
            const googleProfile = await googleRes.json();
            if (googleProfile.email) email = googleProfile.email;
            if (googleProfile.name) name = googleProfile.name;
            if (googleProfile.sub) googleId = googleProfile.sub;
          }
        } catch (e) {
          console.warn('[Google AccessToken Verification Warning]', e.message);
        }
      }

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
          phone: phone ? phone.trim() : '',
        });
      } else {
        let changed = false;
        if (!user.googleId) {
          user.googleId = googleId;
          changed = true;
        }
        if (name && (!user.name || user.name === 'Google Citizen')) {
          user.name = name;
          changed = true;
        }
        if (phone && phone.trim() && !user.phone) {
          user.phone = phone.trim();
          changed = true;
        }
        if (changed) {
          await user.save();
        }
      }

      if (user.isBlocked) {
        return sendError(res, { code: 'ACCOUNT_BLOCKED', message: `Account is blocked. Reason: ${user.blockReason || 'Terms violation'}` }, 403);
      }

      const jwtAccessToken = generateAccessToken(user);
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
        accessToken: jwtAccessToken,
        refreshToken: rawRefreshToken,
      });
    } catch (err) {
      return sendError(res, { code: 'GOOGLE_AUTH_ERROR', message: err.message }, 500);
    }
  }
}
