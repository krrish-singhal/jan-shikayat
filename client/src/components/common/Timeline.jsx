import React from 'react';
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

export const Timeline = ({
  events = [],
  currentStatus = 'SUBMITTED',
  rejectionReason = '',
  completionNote = '',
  completionImageUrl = '',
  isCitizenView = true,
}) => {
  const isRejected = currentStatus === 'REJECTED';
  const isCompleted = currentStatus === 'COMPLETED';

  const defaultMilestones = [
    { key: 'SUBMITTED', label: 'Complaint Submitted', icon: FileText },
    { key: 'VERIFICATION_NEEDED', label: 'Accepted by Department', icon: CheckCircle2 },
    { key: 'VERIFICATION_IN_PROGRESS', label: 'Ground Verification In Progress', icon: Search },
    { key: 'APPROVED', label: 'Ground Verification Approved', icon: Check },
    { key: 'WORK_IN_PROGRESS', label: 'Work Started On-Site', icon: Wrench },
    { key: 'COMPLETED', label: 'Work Completed', icon: Award },
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
        Complaint Lifecycle Timeline
      </h3>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {defaultMilestones.map((m, index) => {
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
                      {new Date(ev.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  )}
                </div>

                {/* Show public note if applicable */}
                {ev?.note && (
                  <p className="mt-1 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 leading-relaxed">
                    {ev.note}
                  </p>
                )}

                {/* Completed Details with Photograph */}
                {m.key === 'COMPLETED' && isCompleted && (completionNote || completionImageUrl) && (
                  <div className="mt-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                    {completionNote && (
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          Completion Remarks
                        </span>
                        <p className="text-sm text-emerald-950 mt-0.5">{completionNote}</p>
                      </div>
                    )}
                    {completionImageUrl && (
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1.5">
                          Verification Photograph
                        </span>
                        <img
                          src={completionImageUrl}
                          alt="Work Completion Verification"
                          className="w-full max-w-sm h-48 object-cover rounded-lg border border-emerald-300 shadow-sm"
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
              <h4 className="text-sm font-bold text-red-700">Complaint Rejected</h4>
              {rejectionReason && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wide block mb-0.5">
                    Rejection Reason
                  </span>
                  <p className="text-sm text-red-900">{rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
