import React from 'react';
import { ChevronLeft, ChevronRight, Search, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../utils/formatters.js';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  searchPlaceholder,
  searchValue = '',
  onSearchChange,
  emptyMessage,
  actions,
}) => {
  const { t, i18n } = useTranslation('common');
  const resolvedSearchPlaceholder = searchPlaceholder || t('search', 'Search records...');
  const resolvedEmptyMessage = emptyMessage || t('noResultsFound', 'No records found');
  return (
    <div className="civic-card overflow-hidden">
      {/* Table Header / Controls */}
      {(onSearchChange || actions) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          {onSearchChange ? (
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={resolvedSearchPlaceholder}
                className="civic-input pl-9 py-2 text-sm"
              />
            </div>
          ) : (
            <div />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-600 text-xs uppercase tracking-wider font-semibold">
              {columns.map((col, index) => (
                <th key={col.key || index} className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium">{resolvedEmptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Real Data Rows
              data.map((row, rowIdx) => (
                <tr
                  key={row._id || rowIdx}
                  className="hover:bg-slate-50/80 transition-colors duration-150 text-slate-700"
                >
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={`px-4 py-3.5 align-middle ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor] || '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && onPageChange && (
        <div className="px-4 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <div>
            {t('showingPagination', {
              page: formatNumber(page, i18n.language),
              totalPages: formatNumber(totalPages, i18n.language),
              total: formatNumber(total, i18n.language),
              defaultValue: `Showing page ${page} of ${totalPages} (${total} total results)`,
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label={t('previous', 'Previous')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-xs text-slate-700 border border-slate-200 bg-white rounded-lg">
              {formatNumber(page, i18n.language)}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label={t('next', 'Next')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
