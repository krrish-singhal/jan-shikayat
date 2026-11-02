export const COMPLAINT_STATUS = {
  SUBMITTED: 'SUBMITTED',
  VERIFICATION_NEEDED: 'VERIFICATION_NEEDED',
  VERIFICATION_IN_PROGRESS: 'VERIFICATION_IN_PROGRESS',
  APPROVED: 'APPROVED',
  WORK_IN_PROGRESS: 'WORK_IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

export const STATUS_LABELS = {
  [COMPLAINT_STATUS.SUBMITTED]: 'Submitted',
  [COMPLAINT_STATUS.VERIFICATION_NEEDED]: 'Verification Needed',
  [COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS]: 'Verifying on Ground',
  [COMPLAINT_STATUS.APPROVED]: 'Approved (Work Pending)',
  [COMPLAINT_STATUS.WORK_IN_PROGRESS]: 'Work in Progress',
  [COMPLAINT_STATUS.COMPLETED]: 'Completed',
  [COMPLAINT_STATUS.REJECTED]: 'Rejected',
};

export const CITIZEN_STATUS_MAP = {
  [COMPLAINT_STATUS.SUBMITTED]: 'Pending',
  [COMPLAINT_STATUS.VERIFICATION_NEEDED]: 'Pending',
  [COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS]: 'Pending',
  [COMPLAINT_STATUS.APPROVED]: 'Approved',
  [COMPLAINT_STATUS.WORK_IN_PROGRESS]: 'Work in Progress',
  [COMPLAINT_STATUS.COMPLETED]: 'Completed',
  [COMPLAINT_STATUS.REJECTED]: 'Rejected',
};

export const STATUS_COLORS = {
  [COMPLAINT_STATUS.SUBMITTED]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [COMPLAINT_STATUS.VERIFICATION_NEEDED]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  [COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS]: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  [COMPLAINT_STATUS.APPROVED]: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  [COMPLAINT_STATUS.WORK_IN_PROGRESS]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  [COMPLAINT_STATUS.COMPLETED]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [COMPLAINT_STATUS.REJECTED]: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};
