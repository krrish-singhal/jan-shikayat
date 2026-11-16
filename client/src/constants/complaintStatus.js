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
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900/60',
    dot: 'bg-amber-500',
  },
  [COMPLAINT_STATUS.VERIFICATION_NEEDED]: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900/60',
    dot: 'bg-blue-500',
  },
  [COMPLAINT_STATUS.VERIFICATION_IN_PROGRESS]: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-900/60',
    dot: 'bg-indigo-500',
  },
  [COMPLAINT_STATUS.APPROVED]: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-900/60',
    dot: 'bg-cyan-500',
  },
  [COMPLAINT_STATUS.WORK_IN_PROGRESS]: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-900/60',
    dot: 'bg-purple-500',
  },
  [COMPLAINT_STATUS.COMPLETED]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-900/60',
    dot: 'bg-emerald-500',
  },
  [COMPLAINT_STATUS.REJECTED]: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-900/60',
    dot: 'bg-red-500',
  },
};
