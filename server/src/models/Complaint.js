import mongoose from 'mongoose';
import { COMPLAINT_STATUS, ALL_STATUSES } from '../constants/complaintStatus.js';

const complaintSchema = new mongoose.Schema(
  {
    ticketNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Complaint photograph is mandatory'],
    },
    location: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      address: {
        type: String,
        required: [true, 'Complaint location address is required'],
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ALL_STATUSES,
      default: COMPLAINT_STATUS.SUBMITTED,
      index: true,
    },
    assignedEngineerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    completionNote: {
      type: String,
      default: '',
      trim: true,
    },
    completionImageUrl: {
      type: String,
      default: '',
    },
    forwardCount: {
      type: Number,
      default: 0,
      index: true,
    },
    isForwardFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast querying & filtering
complaintSchema.index({ departmentId: 1, status: 1 });
complaintSchema.index({ citizenId: 1, status: 1, createdAt: -1 });
complaintSchema.index({ assignedEngineerId: 1, status: 1 });
complaintSchema.index({ createdAt: -1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
