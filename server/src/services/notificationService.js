import nodemailer from 'nodemailer';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

let transporter = null;

function getMailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  } else {
    // In dev / unconfigured mode, use simulated logger transport
    transporter = {
      sendMail: async (mailOptions) => {
        console.log(`[Email Simulated (${mailOptions.to})] Subject: ${mailOptions.subject}`);
        return { messageId: 'simulated-' + Date.now() };
      },
    };
  }
  return transporter;
}

export class NotificationService {
  /**
   * Dispatches notifications for status changes to citizen and relevant staff.
   */
  static async notifyStatusChange(complaint, newStatus, actor, note = '') {
    try {
      const citizen = await User.findById(complaint.citizenId);
      if (!citizen || citizen.isDeleted) return;

      const message = `Complaint #${complaint.ticketNo} status updated to '${newStatus}'. ${note ? `Note: ${note}` : ''}`.trim();

      // Create in-app notification for citizen
      await Notification.create({
        userId: citizen._id,
        complaintId: complaint._id,
        message,
        type: newStatus === 'REJECTED' ? 'WARNING' : newStatus === 'COMPLETED' ? 'SUCCESS' : 'INFO',
      });

      // Send email asynchronously
      if (citizen.email && !citizen.email.includes('anonymized.local')) {
        const mailer = getMailTransporter();
        await mailer.sendMail({
          from: process.env.EMAIL_FROM || '"JanShikayat Municipal Portal" <noreply@civic.gov.in>',
          to: citizen.email,
          subject: `Status Update: Complaint #${complaint.ticketNo}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Municipal Citizen Complaint Portal</h2>
              <p>Dear <strong>${citizen.name}</strong>,</p>
              <p>Your complaint with Ticket Number <strong>${complaint.ticketNo}</strong> has been updated.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 16px 0;">
                <p style="margin: 0;"><strong>Current Status:</strong> ${newStatus}</p>
                ${note ? `<p style="margin: 6px 0 0 0;"><strong>Details:</strong> ${note}</p>` : ''}
              </div>
              <p>You can track the full progress and inspect work milestones on your citizen dashboard.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <small style="color: #64748b;">This is an automated system notification from JanShikayat Municipal Services.</small>
            </div>
          `,
        });
      }
    } catch (err) {
      console.error('[NotificationService notifyStatusChange Error]', err.message);
    }
  }

  /**
   * Sends password reset email.
   */
  static async sendPasswordResetEmail(user, resetUrl) {
    try {
      const mailer = getMailTransporter();
      await mailer.sendMail({
        from: process.env.EMAIL_FROM || '"JanShikayat Municipal Portal" <noreply@civic.gov.in>',
        to: user.email,
        subject: 'Password Reset Request - JanShikayat',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e3a8a;">JanShikayat Password Reset</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>You recently requested to reset your password. Click the link below to set a new password:</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[NotificationService sendPasswordResetEmail Error]', err.message);
    }
  }
}
