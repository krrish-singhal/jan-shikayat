import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const AuditLogs = () => {
  const { addToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Log Inspection Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
      };
      const res = await api.get('/admin/audit', { params });
      setLogs(res.data.data.items || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotalCount(res.data.data.total || 0);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Municipal Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically immutable, append-only operational log recording all administrative overrides, staff actions, and complaint status transitions ({totalCount} logged events)
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, actor name, or log notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="civic-input pl-9 text-xs"
            />
          </div>
          <button type="submit" className="civic-btn-secondary text-xs">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Date Range:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="civic-input py-1 px-2 text-xs w-auto"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="civic-input py-1 px-2 text-xs w-auto"
            />
          </div>

          {(startDate || endDate || search) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-brand-600 hover:text-brand-700 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="civic-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Actor / Official</th>
                <th className="py-2.5 px-4">Target / Ticket</th>
                <th className="py-2.5 px-4">Notes &amp; Details</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Streaming audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{log.action}</span>
                        {log.isAdminOverride && (
                          <span className="text-[9px] font-sans font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 border border-rose-200 rounded">
                            OVERRIDE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.actorName || 'System'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{log.actorRole || 'SYSTEM'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {log.complaintId ? (
                        <Link
                          to={`/admin/complaints/${log.complaintId._id || log.complaintId}`}
                          className="font-mono font-semibold text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <span>{log.complaintId.ticketNo || 'Ticket'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate text-slate-600">
                      {log.notes || 'No notes attached'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100"
                        title="Inspect Log Entry"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="civic-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="civic-btn-secondary px-2 py-1 text-xs disabled:opacity-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Trail Log Dossier"
        maxWidth="max-w-lg"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 font-mono">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-brand-400">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Actor:</span>
                <span>{selectedLog.actorName} ({selectedLog.actorRole})</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Timestamp:</span>
                <span>{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
              {selectedLog.isAdminOverride && (
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="text-rose-400">Override Flag:</span>
                  <span className="text-rose-300 font-bold">TRUE (Bypassed State Machine)</span>
                </div>
              )}
              {selectedLog.previousStatus && (
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Status Transition:</span>
                  <span>{selectedLog.previousStatus} → {selectedLog.newStatus}</span>
                </div>
              )}
            </div>

            <div>
              <span className="font-semibold text-slate-700 block mb-1">Audit Notes / Explanation</span>
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                {selectedLog.notes || 'None'}
              </p>
            </div>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Raw Context Metadata</span>
                <pre className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-slate-800 overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="civic-btn-secondary text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
