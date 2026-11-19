import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, MessageSquarePlus } from 'lucide-react';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const CATEGORIES = ['General', 'SLA', 'Maintenance', 'Operations', 'Portal', 'Charter'];

const statusBadgeClass = (status) => {
  if (status === 'approved') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  if (status === 'rejected') return 'bg-red-500/20 text-red-300 border border-red-500/30';
  return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
};

export const NoticeRequestModal = ({ isOpen, onClose }) => {
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchMyRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await api.get('/notice-requests/my');
      if (res.data?.success) {
        const list = res.data.data?.requests || (Array.isArray(res.data.data) ? res.data.data : []);
        setMyRequests(list);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setReason('');
      setCategory('General');
      setHistoryOpen(false);
      fetchMyRequests();
    }
  }, [isOpen, fetchMyRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      await api.post('/notice-requests', { title: title.trim(), reason: reason.trim(), category });
      window.dispatchEvent(new CustomEvent('notice-requests-updated'));
      addToast('Notice request submitted! Admin will review shortly.', 'success');
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700/60 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquarePlus className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Request Notice Publication</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit a notice to be published on the public notice board (pending admin approval)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50 ml-3 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <form id="notice-request-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Notice Text */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Notice Text / Announcement <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the notice text to be published…"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1 text-right">{title.length}/500</p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Reason / Message to Admin <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                maxLength={300}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why should this notice be published? Any context for admin…"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1 text-right">{reason.length}/300</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </form>

          {/* My Previous Requests — collapsible */}
          <div className="border border-slate-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-800/60 hover:bg-slate-700/40 transition-colors"
            >
              <span>My Previous Requests ({myRequests.length})</span>
              {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {historyOpen && (
              <div className="divide-y divide-slate-700/50">
                {loadingRequests ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">Loading…</div>
                ) : myRequests.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">No requests submitted yet.</div>
                ) : (
                  myRequests.map((req) => (
                    <div key={req._id} className="px-4 py-3 flex items-start gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize ${statusBadgeClass(req.status)}`}>
                        {req.status}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-200 truncate">{req.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-600">•</span>
                          <span className="text-[10px] text-slate-500">{req.category}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="notice-request-form"
            disabled={submitting || !title.trim()}
            className="px-5 py-2 text-sm font-semibold text-amber-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
