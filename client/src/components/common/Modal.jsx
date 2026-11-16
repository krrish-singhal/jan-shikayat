import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background page from scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for disappearing scrollbar to avoid layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
    >
      {/* Backdrop with blur effect and scroll/touch containment */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-md overscroll-contain transition-all animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Official Government Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-300 dark:border-slate-800 z-10 overflow-hidden animate-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <h3 id="modal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto overscroll-contain font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
};
