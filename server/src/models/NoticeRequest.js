import mongoose from 'mongoose';

const noticeRequestSchema = new mongoose.Schema(
  {
    // The notice text/content the staff member wants published
    title: { type: String, required: true, trim: true, maxlength: 500 },
    // Optional message to admin explaining why
    reason: { type: String, trim: true, maxlength: 300 },
    // Category suggestion
    category: { type: String, default: 'General' },
    // Who submitted it
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // 'pending' | 'approved' | 'rejected'
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    // Admin note when approving/rejecting
    adminNote: { type: String, trim: true, maxlength: 300 },
    // If approved, link to the created Notice
    noticeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice' },
    // Admin who reviewed it
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const NoticeRequest = mongoose.model('NoticeRequest', noticeRequestSchema);
