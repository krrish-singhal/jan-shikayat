import mongoose from 'mongoose';

const complaintEventSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fromStatus: {
      type: String,
      default: null,
    },
    toStatus: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    isAdminOverride: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

complaintEventSchema.index({ complaintId: 1, createdAt: 1 });

export const ComplaintEvent = mongoose.model('ComplaintEvent', complaintEventSchema);
