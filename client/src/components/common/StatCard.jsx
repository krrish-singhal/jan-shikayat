import React, { useEffect, useRef, useState } from 'react';

// Animated dialer counter hook — counts up smoothly from 0 (or previous value) to target
function useCountUp(target, duration = 1000) {
  const numericTarget = typeof target === 'string'
    ? Number(target.replace(/[^0-9.]/g, ''))
    : Number(target);

  const isValidNumber = isFinite(numericTarget) && target !== '—' && target !== null && target !== undefined;

  const prevValueRef = useRef(0);
  const [displayValue, setDisplayValue] = useState(() => (isValidNumber ? 0 : target));
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!isValidNumber) {
      setDisplayValue(target);
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = numericTarget;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    startTimeRef.current = null;

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth ease-out cubic for realistic meter / dialer increment
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);

      setDisplayValue(
        typeof target === 'string'
          ? target.replace(/[0-9,]+/, current.toLocaleString())
          : current
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevValueRef.current = endVal;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [numericTarget, duration, isValidNumber, target]);

  return isValidNumber ? displayValue : target;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  onClick,
}) => {
  const animatedValue = useCountUp(value);
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
      accent: 'from-blue-600 to-indigo-600',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/50',
      accent: 'from-amber-500 to-orange-500',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      accent: 'from-emerald-600 to-teal-600',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900/50',
      accent: 'from-purple-600 to-pink-600',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
      border: 'border-red-100 dark:border-red-900/50',
      accent: 'from-red-600 to-rose-600',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`civic-card p-5 relative overflow-hidden flex flex-col justify-between group transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-600' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight tabular-nums transition-all">
            {animatedValue}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme.bg} ${scheme.border} shrink-0 transition-transform duration-200 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {/* Accent bar: starts at 60% width, expands to 100% on hover */}
      <div className={`h-1 bg-gradient-to-r ${scheme.accent} rounded-full mt-4 opacity-80 transition-all duration-500 w-[60%] group-hover:w-full`} />
    </div>
  );
};
