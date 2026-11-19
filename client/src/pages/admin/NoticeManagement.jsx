import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const NoticeManagement = () => {
  const { addToast } = useToast();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, notice: null });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    category: 'General',
    priority: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('notices'); // 'notices' | 'requests'

  // Requests state
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  // Reject inline state: { [requestId]: { open: bool, note: string } }
  const [rejectState, setRejectState] = useState({});

  useEffect(() => {
    fetchNotices();
    fetchPendingCount();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
      fetchPendingCount();
    }
  }, [activeTab, filterStatus]);

  useEffect(() => {
    const handleNoticeUpdate = (e) => {
      if (typeof e.detail?.count === 'number') {
        setPendingCount(e.detail.count);
      } else {
        fetchPendingCount();
      }
      if (activeTab === 'requests') {
        fetchRequests();
      }
    };
    window.addEventListener('notice-requests-updated', handleNoticeUpdate);
    return () => window.removeEventListener('notice-requests-updated', handleNoticeUpdate);
  }, [activeTab]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices/admin');
      setNotices(res.data?.data || []);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load notices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await api.get(`/notice-requests/admin?status=${filterStatus === 'all' ? '' : filterStatus}`);
      const list = res.data?.data?.requests || (Array.isArray(res.data?.data) ? res.data.data : []);
      setRequests(list);
    } catch (err) {
      addToast('Failed to load notice requests', 'error');
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/notice-requests/admin/count');
      const count = res.data?.data?.count ?? 0;
      setPendingCount(count);
      window.dispatchEvent(new CustomEvent('notice-requests-updated', { detail: { count } }));
      return count;
    } catch { }
  };

  const handleReview = async (requestId, action, adminNote = '') => {
    try {
      const res = await api.patch(`/notice-requests/admin/${requestId}`, { action, adminNote });
      addToast(
        action === 'approve' ? 'Notice request approved and published!' : 'Notice request rejected.',
        'success'
      );
      setRejectState((prev) => ({ ...prev, [requestId]: { open: false, note: '' } }));
      fetchRequests();

      const serverCount = res.data?.data?.count;
      if (typeof serverCount === 'number') {
        setPendingCount(serverCount);
        window.dispatchEvent(new CustomEvent('notice-requests-updated', { detail: { count: serverCount } }));
      } else {
        fetchPendingCount();
      }

      if (action === 'approve') fetchNotices();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to review request', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Notice title/text cannot be empty', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/notices/admin', formData);
      addToast('Notice published successfully to public Notice Board', 'success');
      setCreateModalOpen(false);
      setFormData({ title: '', date: '', category: 'General', priority: 0, isActive: true });
      fetchNotices();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to create notice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Notice title/text cannot be empty', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await api.patch(`/notices/admin/${selectedNotice._id}`, formData);
      addToast('Notice updated successfully', 'success');
      setEditModalOpen(false);
      setSelectedNotice(null);
      fetchNotices();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to update notice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.notice) return;
    try {
      await api.delete(`/notices/admin/${deleteDialog.notice._id}`);
      addToast('Notice removed successfully', 'success');
      setDeleteDialog({ isOpen: false, notice: null });
      fetchNotices();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to delete notice', 'error');
    }
  };

  const openEditModal = (notice) => {
    setSelectedNotice(notice);
    setFormData({
      title: notice.title || '',
      date: notice.date || '',
      category: notice.category || 'General',
      priority: notice.priority || 0,
      isActive: notice.isActive !== undefined ? notice.isActive : true,
    });
    setEditModalOpen(true);
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.category?.toLowerCase().includes(search.toLowerCase()) ||
      n.date?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status) => {
    if (status === 'pending')
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-700">
          Pending
        </span>
      );
    if (status === 'approved')
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-700">
          Approved
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold border border-red-300 dark:border-red-700">
        Rejected
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-[#FF9933]" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Notice Board Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish, edit, and manage public announcements visible on the JanShikayat home page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            className="civic-btn-secondary text-xs flex items-center gap-1.5"
            title="Preview Home Page Notice Board"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Home Board</span>
          </Link>
          <button
            onClick={() => {
              setFormData({ title: '', date: '', category: 'General', priority: 0, isActive: true });
              setCreateModalOpen(true);
            }}
            className="civic-btn-primary text-xs flex items-center gap-1.5 !bg-[#1F3A6E] hover:!bg-[#172d54]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Notice</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2 text-xs font-semibold transition-colors ${activeTab === 'notices'
              ? 'border-b-2 border-amber-400 text-amber-600 dark:text-amber-300'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
        >
          Published Notices
        </button>
        <button
          onClick={() => { setActiveTab('requests'); }}
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-1 transition-colors ${activeTab === 'requests'
              ? 'border-b-2 border-amber-400 text-amber-600 dark:text-amber-300'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Notice Requests
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-bold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ===== NOTICES TAB ===== */}
      {activeTab === 'notices' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search notices by title, date, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="civic-input pl-10 text-xs w-full"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Total Notices: <strong className="text-slate-900 dark:text-slate-100">{filteredNotices.length}</strong>
            </div>
          </div>

          {/* Notices Table */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                Loading notice board records...
              </div>
            ) : filteredNotices.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <BellRing className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-semibold">No notices found</p>
                <p className="text-xs">Click "Add New Notice" above to publish your first announcement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Notice Title / Announcement</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredNotices.map((notice) => (
                      <tr key={notice._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {notice.date || new Date(notice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-md">
                          {notice.title}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1F3A6E] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-semibold">
                            {notice.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {notice.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                              <XCircle className="w-3.5 h-3.5" /> Hidden
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(notice)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="Edit Notice"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteDialog({ isOpen: true, notice })}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                              title="Delete Notice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== REQUESTS TAB ===== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filter buttons */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-2">
            {['pending', 'approved', 'rejected', 'all'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${filterStatus === status
                    ? 'bg-[#1F3A6E] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400">
              {requests.length} request{requests.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Requests list */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {requestsLoading ? (
              <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                Loading notice requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <MessageSquarePlus className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-semibold">No notice requests</p>
                <p className="text-xs">
                  {filterStatus === 'pending'
                    ? 'No pending notice requests from staff.'
                    : `No ${filterStatus === 'all' ? '' : filterStatus} notice requests found.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req) => {
                  const rs = rejectState[req._id] || { open: false, note: '' };
                  return (
                    <div
                      key={req._id}
                      className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        {/* Left: main info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {/* Status + category */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {statusBadge(req.status)}
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1F3A6E] dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-semibold">
                              {req.category || 'General'}
                            </span>
                          </div>

                          {/* Notice text */}
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                            {req.title?.length > 80 ? req.title.slice(0, 80) + '…' : req.title}
                          </p>

                          {/* Submitted by */}
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {req.requestedBy?.name || 'Unknown'}
                            </span>
                            {req.requestedBy?.role && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {req.requestedBy.role}
                              </span>
                            )}
                            {req.requestedBy?.staffId && (
                              <span className="font-mono text-[10px] text-slate-400">{req.requestedBy.staffId}</span>
                            )}
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>

                          {/* Admin note (if rejected/approved) */}
                          {req.adminNote && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              Admin note: {req.adminNote}
                            </p>
                          )}

                          {/* Inline reject input */}
                          {rs.open && (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Rejection note (optional)"
                                value={rs.note}
                                onChange={(e) =>
                                  setRejectState((prev) => ({
                                    ...prev,
                                    [req._id]: { ...prev[req._id], note: e.target.value },
                                  }))
                                }
                                className="civic-input text-xs flex-1"
                              />
                              <button
                                onClick={() => handleReview(req._id, 'reject', rs.note)}
                                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() =>
                                  setRejectState((prev) => ({
                                    ...prev,
                                    [req._id]: { open: false, note: '' },
                                  }))
                                }
                                className="px-2 py-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Right: action buttons (only for pending) */}
                        {req.status === 'pending' && !rs.open && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleReview(req._id, 'approve')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                              title="Approve"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                setRejectState((prev) => ({
                                  ...prev,
                                  [req._id]: { open: true, note: '' },
                                }))
                              }
                              className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-100 dark:bg-red-950/50 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 text-xs font-semibold"
                              title="Reject"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Notice to Home Notice Board"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Notice Text / Announcement <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Scheduled water supply maintenance in Ward 7 on 25 Nov 2026..."
              className="civic-input text-xs w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Display Date (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 18 Nov 2026 (blank for today)"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="civic-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="civic-input text-xs w-full"
              >
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="SLA">SLA Update</option>
                <option value="Portal">Portal Announcement</option>
                <option value="Operations">Operations</option>
                <option value="Charter">Citizen Charter</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="create-isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-[#1F3A6E] focus:ring-[#1F3A6E]"
            />
            <label htmlFor="create-isActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Publish immediately on Home Page Notice Board
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary text-xs !bg-[#1F3A6E]"
            >
              {submitting ? 'Publishing...' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Notice"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Notice Text / Announcement <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="civic-input text-xs w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Display Date
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="civic-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="civic-input text-xs w-full"
              >
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="SLA">SLA Update</option>
                <option value="Portal">Portal Announcement</option>
                <option value="Operations">Operations</option>
                <option value="Charter">Citizen Charter</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="edit-isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-[#1F3A6E] focus:ring-[#1F3A6E]"
            />
            <label htmlFor="edit-isActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Visible on Public Notice Board
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary text-xs !bg-[#1F3A6E]"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Notice"
        message="Are you sure you want to permanently remove this notice from the Notice Board?"
        confirmText="Delete Notice"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, notice: null })}
      />
    </div>
  );
};
