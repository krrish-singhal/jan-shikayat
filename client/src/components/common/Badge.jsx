import React from 'react';
import { STATUS_COLORS, CITIZEN_STATUS_MAP } from '../../constants/complaintStatus.js';

export const StatusBadge = ({ status, isCitizenView = false }) => {
  const displayLabel = isCitizenView ? (CITIZEN_STATUS_MAP[status] || status) : status;
  const config = STATUS_COLORS[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {displayLabel}
    </span>
  );
};

export const Badge = StatusBadge;

export const RoleBadge = ({ role }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (role === 'ADMIN') {
    style = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (role === 'OPERATOR') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (role === 'ENGINEER') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (role === 'CITIZEN') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style}`}>
      {role}
    </span>
  );
};
