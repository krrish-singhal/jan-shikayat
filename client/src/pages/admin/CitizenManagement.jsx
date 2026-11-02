import React, { useState, useEffect } from 'react';
import {
  User,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  FileText,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const CitizenManagement = () => {
  const { addToast } = useToast();

  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Dialogs
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  const [unblockDialog, setUnblockDialog] = useState({ isOpen: false, citizen: null });
  const [anonymizeDialog, setAnonymizeDialog] = useState({ isOpen: false, citizen: null });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCitizens();
  }, [page, statusFilter]);

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter,
        search,
      };
      const res = await api.get('/admin/citizens', { params });
      setCitizens(res.data.data.items || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotalCount(res.data.data.total || 0);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load citizens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCitizens();
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockReason.trim() || blockReason.trim().length < 5) {
      addToast('A mandatory reason (min 5 characters) is required to block a citizen', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/admin/citizens/${selectedCitizen._id}/block`, {
        isBlocked: true,
        blockReason: blockReason.trim(),
      });
      addToast(`Citizen account ${selectedCitizen.name} has been blocked`, 'success');
      setBlockModalOpen(false);
      setSelectedCitizen(null);
      setBlockReason('');
      fetchCitizens();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to block citizen', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblockConfirm = async () => {
    const citizen = unblockDialog.citizen;
    if (!citizen) return;

    try {
      setSubmitting(true);
      await api.patch(`/admin/citizens/${citizen._id}/block`, {
        isBlocked: false,
      });
      addToast(`Citizen account ${citizen.name} has been unblocked`, 'success');
      setUnblockDialog({ isOpen: false, citizen: null });
      fetchCitizens();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to unblock citizen', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnonymizeConfirm = async () => {
    const citizen = anonymizeDialog.citizen;
    if (!citizen) return;

    try {
      setSubmitting(true);
      await api.delete(`/admin/citizens/${citizen._id}`);
      addToast('Citizen profile personal data anonymized; municipal complaint records preserved', 'success');
      setAnonymizeDialog({ isOpen: false, citizen: null });
      fetchCitizens();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to anonymize citizen account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Citizen Registry</h2>
        <p className="text-xs text-slate-500 mt-1">
          Civic registry of registered residents, complaint history, and account governance ({totalCount} registered)
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by citizen name, email, or phone number..."
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
            <span>Filter Status:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="civic-input py-1 px-2.5 text-xs w-auto"
          >
            <option value="ALL">All Residents</option>
            <option value="ACTIVE">Active Residents</option>
            <option value="BLOCKED">Blocked Residents</option>
          </select>
        </div>
      </div>

      {/* Citizens Table */}
      <div className="civic-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Resident</th>
                <th className="py-2.5 px-4">Contact Details</th>
                <th className="py-2.5 px-4 text-center">Complaints Filed</th>
                <th className="py-2.5 px-4">Registered Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading citizen directory...</span>
                    </div>
                  </td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No citizens found matching your criteria.
                  </td>
                </tr>
              ) : (
                citizens.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      {c.isBlocked && c.blockReason && (
                        <div className="text-[10px] text-rose-600 font-medium">
                          Reason: {c.blockReason}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div>{c.email}</div>
                      <div className="text-[11px] text-slate-400">{c.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                        {c.complaintCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          c.isBlocked
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {c.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.isBlocked ? (
                          <button
                            onClick={() => setUnblockDialog({ isOpen: true, citizen: c })}
                            title="Unblock Citizen"
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCitizen(c);
                              setBlockReason('');
                              setBlockModalOpen(true);
                            }}
                            title="Block Citizen"
                            className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setAnonymizeDialog({ isOpen: true, citizen: c })}
                          title="Anonymize / Delete Personal Data"
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* Block Citizen Modal */}
      <Modal
        isOpen={blockModalOpen}
        onClose={() => {
          setBlockModalOpen(false);
          setSelectedCitizen(null);
        }}
        title={`Block Citizen - ${selectedCitizen?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleBlockSubmit} className="space-y-4 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800">
            <strong className="block font-bold">Account Restriction Notice</strong>
            Blocked citizens cannot authenticate, submit new complaints, or access existing portals. Their past filed complaints remain in municipal queues.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Reason for Account Block *
            </label>
            <textarea
              required
              rows={3}
              minLength={5}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="civic-input"
              placeholder="State the reason (e.g. repeated fraudulent/spam submissions, abuse of public civic channels)..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setBlockModalOpen(false);
                setSelectedCitizen(null);
              }}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary bg-rose-600 hover:bg-rose-700 text-xs"
            >
              {submitting ? 'Blocking...' : 'Confirm Block'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Unblock Dialog */}
      <ConfirmDialog
        isOpen={unblockDialog.isOpen}
        onClose={() => setUnblockDialog({ isOpen: false, citizen: null })}
        onConfirm={handleUnblockConfirm}
        title="Unblock Citizen Account"
        message={`Restore civic portal access for ${unblockDialog.citizen?.name} (${unblockDialog.citizen?.email})? They will be able to log in and file complaints again.`}
        confirmText="Unblock Citizen"
        type="info"
        loading={submitting}
      />

      {/* Anonymize / Delete Dialog */}
      <ConfirmDialog
        isOpen={anonymizeDialog.isOpen}
        onClose={() => setAnonymizeDialog({ isOpen: false, citizen: null })}
        onConfirm={handleAnonymizeConfirm}
        title="Anonymize Citizen Record"
        message={`This will purge all personal identifying information (Name, Email, Phone) for ${anonymizeDialog.citizen?.name}. In accordance with municipal record keeping, their ${anonymizeDialog.citizen?.complaintCount || 0} filed complaint(s) will remain preserved in the municipal repository with anonymized authorship.`}
        confirmText="Confirm Anonymization"
        type="danger"
        loading={submitting}
      />
    </div>
  );
};
