import React from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_COLORS, CITIZEN_STATUS_MAP, STATUS_LABELS } from '../../constants/complaintStatus.js';

export const StatusBadge = ({ status, isCitizenView = false }) => {
  const { t } = useTranslation('common');
  const rawKey = isCitizenView ? (CITIZEN_STATUS_MAP[status] || status) : status;
  const fallbackLabel = isCitizenView
    ? (CITIZEN_STATUS_MAP[status] || status)
    : (STATUS_LABELS[status] || status);
  const normalizedKey = (rawKey || '').toUpperCase().replace(/\s+/g, '_');
  const normalizedStatus = (status || '').toUpperCase().replace(/\s+/g, '_');
  const displayLabel = t(`statusMap.${normalizedKey}`, t(`statusMap.${normalizedStatus}`, fallbackLabel));

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
  const { t } = useTranslation('common');
  let style = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (role === 'ADMIN') {
    style = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60';
  } else if (role === 'OPERATOR') {
    style = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60';
  } else if (role === 'ENGINEER') {
    style = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
  } else if (role === 'CITIZEN') {
    style = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style}`}>
      {t(`roles.${role}`, role)}
    </span>
  );
};
