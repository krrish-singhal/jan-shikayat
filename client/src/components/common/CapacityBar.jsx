import React from 'react';
import { AlertCircle } from 'lucide-react';

export const CapacityBar = ({
  maxActiveCases,
  activeCases,
  max,
  current,
}) => {
  const effectiveMax = maxActiveCases ?? max ?? 5;
  const effectiveActive = activeCases ?? current ?? 0;

  const available = Math.max(0, effectiveMax - effectiveActive);
  const percentage = Math.min(100, Math.round((effectiveActive / (effectiveMax || 1)) * 100));
  const isFull = effectiveActive >= effectiveMax;

  let barColor = 'bg-emerald-600';
  let badgeColor = 'text-emerald-800 bg-emerald-50 border-emerald-300';

  if (percentage >= 80) {
    barColor = isFull ? 'bg-red-600' : 'bg-amber-500';
    badgeColor = isFull ? 'text-red-800 bg-red-50 border-red-300' : 'text-amber-800 bg-amber-50 border-amber-300';
  }

  return (
    <div className="civic-card p-3.5 sm:p-4 bg-slate-50 border border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Workload Capacity
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg sm:text-xl font-bold text-slate-900">
              {effectiveActive} <span className="text-xs font-normal text-slate-500">/ {effectiveMax} cases</span>
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${badgeColor}`}>
          {isFull ? 'Capacity Reached' : `${available} Slot${available === 1 ? '' : 's'} Free`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isFull && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Maximum case workload reached. Complete or release cases to pick up more.</span>
        </div>
      )}
    </div>
  );
};
