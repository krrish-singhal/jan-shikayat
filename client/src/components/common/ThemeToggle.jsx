import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export const ThemeToggle = ({ variant = 'default', className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  const isPublic = variant === 'public';
  const isCompact = variant === 'compact';

  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-md transition-all font-medium text-xs focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${
        isPublic
          ? 'px-2 py-1 bg-[#082543] text-amber-300 hover:text-white border border-blue-900/60 shadow-xs'
          : isCompact
          ? 'p-2 text-slate-600 dark:text-slate-300 hover:text-[#0f3b68] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
          : 'px-2.5 py-1.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs gap-1.5'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {!isCompact && !isPublic && <span className="hidden sm:inline">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          {!isCompact && !isPublic && <span className="hidden sm:inline">Dark</span>}
        </>
      )}
    </button>
  );
};

