import { Notice } from '../models/Notice.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const NoticeController = {
  // Public: Get all active notices for home page notice board
  async getPublicNotices(req, res) {
    try {
      const notices = await Notice.find({ isActive: true })
        .sort({ priority: -1, createdAt: -1 })
        .limit(20);

      // Default fallback notices if database has none seeded
      if (notices.length === 0) {
        const defaultNotices = [
          { _id: 'default-1', date: '15 Nov 2026', title: 'Online grievance submission portal updated with multi-language support.', category: 'Portal' },
          { _id: 'default-2', date: '10 Nov 2026', title: 'New SLA: Road & Pothole complaints resolved within 5 working days.', category: 'SLA' },
          { _id: 'default-3', date: '05 Nov 2026', title: 'Scheduled maintenance: Water supply disruption on 20 Nov (6–10 AM).', category: 'Maintenance' },
          { _id: 'default-4', date: '01 Nov 2026', title: 'Field engineers to upload geo-tagged photos for all closed complaints.', category: 'Operations' },
          { _id: 'default-5', date: '28 Oct 2026', title: 'Citizen charter revised — download the updated PDF from the helpdesk.', category: 'Charter' },
        ];
        return sendSuccess(res, defaultNotices, 'Public notices retrieved successfully');
      }

      return sendSuccess(res, notices, 'Public notices retrieved successfully');
    } catch (err) {
      console.error('[NoticeController:getPublicNotices]', err);
      return sendError(res, { code: 'NOTICE_FETCH_ERROR', message: 'Failed to fetch notices' }, 500);
    }
  },

  // Admin: Get all notices (including inactive)
  async getAllNoticesAdmin(req, res) {
    try {
      const notices = await Notice.find()
        .populate('createdBy', 'name email staffId')
        .sort({ createdAt: -1 });

      return sendSuccess(res, notices, 'All notices retrieved');
    } catch (err) {
      console.error('[NoticeController:getAllNoticesAdmin]', err);
      return sendError(res, { code: 'NOTICE_ADMIN_FETCH_ERROR', message: 'Failed to fetch admin notices' }, 500);
    }
  },

  // Admin: Create notice
  async createNotice(req, res) {
    try {
      const { title, date, category, priority } = req.body;
      if (!title || !title.trim()) {
        return sendError(res, { code: 'VALIDATION_ERROR', message: 'Notice text is required' }, 400);
      }

      const notice = await Notice.create({
        title: title.trim(),
        date: date && date.trim() ? date.trim() : undefined,
        category: category || 'General',
        priority: Number(priority) || 0,
        createdBy: req.user?._id,
      });

      return sendSuccess(res, notice, 'Notice created successfully', 201);
    } catch (err) {
      console.error('[NoticeController:createNotice]', err);
      return sendError(res, { code: 'NOTICE_CREATE_ERROR', message: 'Failed to create notice' }, 500);
    }
  },

  // Admin: Update notice
  async updateNotice(req, res) {
    try {
      const { id } = req.params;
      const { title, date, category, priority, isActive } = req.body;

      const notice = await Notice.findById(id);
      if (!notice) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Notice not found' }, 404);
      }

      if (title !== undefined) notice.title = title.trim();
      if (date !== undefined) notice.date = date.trim();
      if (category !== undefined) notice.category = category;
      if (priority !== undefined) notice.priority = Number(priority);
      if (isActive !== undefined) notice.isActive = Boolean(isActive);

      await notice.save();

      return sendSuccess(res, notice, 'Notice updated successfully');
    } catch (err) {
      console.error('[NoticeController:updateNotice]', err);
      return sendError(res, { code: 'NOTICE_UPDATE_ERROR', message: 'Failed to update notice' }, 500);
    }
  },

  // Admin: Delete notice
  async deleteNotice(req, res) {
    try {
      const { id } = req.params;
      const notice = await Notice.findByIdAndDelete(id);
      if (!notice) {
        return sendError(res, { code: 'NOT_FOUND', message: 'Notice not found' }, 404);
      }

      return sendSuccess(res, { id }, 'Notice deleted successfully');
    } catch (err) {
      console.error('[NoticeController:deleteNotice]', err);
      return sendError(res, { code: 'NOTICE_DELETE_ERROR', message: 'Failed to delete notice' }, 500);
    }
  },
};
