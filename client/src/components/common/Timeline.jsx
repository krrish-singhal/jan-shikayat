import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  CheckCircle2,
  Search,
  Check,
  Wrench,
  Award,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatDateTime, getImageUrl } from '../../utils/formatters.js';
import { TranslatedContent } from './TranslatedContent.jsx';

export const Timeline = ({
  events = [],
  currentStatus = 'SUBMITTED',
  rejectionReason = '',
  completionNote = '',
  completionImageUrl = '',
  isCitizenView = true,
  complaintId,
}) => {
  const { t, i18n } = useTranslation(['common', 'citizen']);
  const isRejected = currentStatus === 'REJECTED';
  const isCompleted = currentStatus === 'COMPLETED';

  const defaultMilestones = [
    { key: 'SUBMITTED', label: t('common:statusMap.SUBMITTED', 'Complaint Submitted'), icon: FileText },
    { key: 'VERIFICATION_NEEDED', label: t('common:statusMap.VERIFICATION_NEEDED', 'Accepted by Department'), icon: CheckCircle2 },
    { key: 'VERIFICATION_IN_PROGRESS', label: t('common:statusMap.VERIFICATION_IN_PROGRESS', 'Ground Verification In Progress'), icon: Search },
    { key: 'APPROVED', label: t('common:statusMap.APPROVED', 'Ground Verification Approved'), icon: Check },
    { key: 'WORK_IN_PROGRESS', label: t('common:statusMap.WORK_IN_PROGRESS', 'Work Started On-Site'), icon: Wrench },
    { key: 'COMPLETED', label: t('common:statusMap.COMPLETED', 'Work Completed'), icon: Award },
  ];

  // Map events to milestones
  const eventMap = {};
  events.forEach((ev) => {
    eventMap[ev.toStatus] = ev;
  });

  return (
    <div className="civic-card p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-brand-600" />
        {t('citizen:timelineTitle', 'Complaint Lifecycle Timeline')}
      </h3>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {defaultMilestones.map((m) => {
          const ev = eventMap[m.key];
          const isPassed = !!ev;
          const isCurrent = currentStatus === m.key;
          const Icon = m.icon;

          let circleStyle = 'bg-white border-2 border-slate-300 text-slate-400';
          let textStyle = 'text-slate-400 font-normal';

          if (isPassed) {
            circleStyle = 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-sm';
            textStyle = 'text-slate-900 font-semibold';
          } else if (isCurrent) {
            circleStyle = 'bg-brand-600 border-2 border-brand-600 text-white shadow-md ring-4 ring-brand-100';
            textStyle = 'text-brand-700 font-bold';
          }

          return (
            <div key={m.key} className="relative flex items-start gap-4">
              {/* Circle Marker */}
              <div
                className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${circleStyle}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Milestone Details */}
              <div className="flex-1 bg-white pt-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className={`text-sm ${textStyle}`}>{m.label}</h4>
                  {ev?.createdAt && (
                    <span className="text-xs text-slate-400 font-mono">
                      {formatDateTime(ev.createdAt, i18n.language)}
                    </span>
                  )}
                </div>

                {/* Show public note if applicable with translation */}
                {ev?.note && (
                  <div className="mt-1 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 leading-relaxed">
                    <TranslatedContent text={ev.note} complaintId={complaintId} />
                  </div>
                )}

                {/* Completed Details with Photograph */}
                {m.key === 'COMPLETED' && isCompleted && (completionNote || completionImageUrl) && (
                  <div className="mt-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                    {completionNote && (
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          {t('citizen:completionRemarks', 'Completion Remarks')}
                        </span>
                        <div className="mt-0.5 text-sm text-emerald-950">
                          <TranslatedContent text={completionNote} complaintId={complaintId} />
                        </div>
                      </div>
                    )}
                    {completionImageUrl && (
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1.5">
                          {t('citizen:verificationPhoto', 'Verification Photograph')}
                        </span>
                        <img
                          src={getImageUrl(completionImageUrl)}
                          alt="Work Completion Verification"
                          className="w-full max-w-sm h-48 object-cover rounded-lg border border-emerald-300 shadow-sm bg-emerald-100"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/uploads/sample-completed.svg';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Rejection Stage if Rejected */}
        {isRejected && (
          <div className="relative flex items-start gap-4">
            <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs bg-red-600 border-2 border-red-600 text-white shadow-md ring-4 ring-red-100">
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 bg-white pt-0.5">
              <h4 className="text-sm font-bold text-red-700">
                {t('common:statusMap.REJECTED', 'Complaint Rejected')}
              </h4>
              {rejectionReason && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wide block mb-0.5">
                    {t('citizen:rejectionReason', 'Rejection Reason')}
                  </span>
                  <div className="text-sm text-red-900">
                    <TranslatedContent text={rejectionReason} complaintId={complaintId} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
