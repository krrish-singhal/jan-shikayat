import React, { useState, useEffect } from 'react';
import { ImageOff, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../../utils/formatters.js';

/**
 * Robust image component with guaranteed fallback, zero recursive loops,
 * and elegant light/dark mode icon display.
 */
export const ComplaintImage = ({
  src,
  alt = 'Complaint evidence',
  className = 'w-10 h-10 rounded-lg',
  iconSize = 'w-4 h-4',
  fallbackText,
  onClick,
  showPlaceholderOnEmpty = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset when source changes
  useEffect(() => {
    setHasError(false);
    setLoaded(false);
  }, [src]);

  const resolvedUrl = src ? getImageUrl(src) : null;

  if (!resolvedUrl || hasError) {
    if (!showPlaceholderOnEmpty && !src) return null;

    return (
      <div
        className={`${className} bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 select-none overflow-hidden transition-colors`}
        title={fallbackText || (hasError ? 'Photo unavailable' : 'No photo evidence')}
      >
        <ImageOff className={`${iconSize} stroke-[1.5]`} />
        {fallbackText && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium text-center px-1 truncate max-w-full">
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative ${className} shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 ${
        onClick ? 'cursor-pointer group' : ''
      }`}
      onClick={onClick}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 animate-pulse">
          <ImageIcon className={`${iconSize} stroke-[1.5] opacity-50`} />
        </div>
      )}
      <img
        src={resolvedUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${onClick ? 'group-hover:opacity-90' : ''}`}
      />
    </div>
  );
};
