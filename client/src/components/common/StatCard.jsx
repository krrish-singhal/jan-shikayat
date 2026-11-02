import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  onClick,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
      accent: 'from-blue-600 to-indigo-600',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
      accent: 'from-amber-500 to-orange-500',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
      accent: 'from-emerald-600 to-teal-600',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
      accent: 'from-purple-600 to-pink-600',
    },
    red: {
      bg: 'bg-red-50 text-red-600',
      border: 'border-red-100',
      accent: 'from-red-600 to-rose-600',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`civic-card p-5 relative overflow-hidden flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme.bg} ${scheme.border} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className={`h-1 w-full bg-gradient-to-r ${scheme.accent} rounded-full mt-4 opacity-80`} />
    </div>
  );
};
