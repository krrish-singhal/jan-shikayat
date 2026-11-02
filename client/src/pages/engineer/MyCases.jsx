import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Wrench,
  Award,
  RotateCcw,
  Upload,
  X,
  MapPin,
  Clock,
} from 'lucide-react';
import api from '../../services/api.js';
import { DataTable } from '../../components/common/DataTable.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { CapacityBar } from '../../components/common/CapacityBar.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const MyCases = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { user } = useAuth();

  const currentTab = searchParams.get('tab') || 'VERIFYING';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Capacity state
  const [capacity, setCapacity] = useState({
    maxActiveCases: user?.maxActiveCases || 5,
    activeCases: 0,
    availableCapacity: 5,
    isAtCapacity: false,
  });

  // Action modals state
  const [selectedCase, setSelectedCase] = useState(null);

  // 1. Approve Ground Verification Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  // 2. Deny Ground Verification Modal
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [denyLoading, setDenyLoading] = useState(false);

  // 3. Start Work Modal
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [startNote, setStartNote] = useState('');
  const [startLoading, setStartLoading] = useState(false);

  // 4. Complete Work Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [completionFile, setCompletionFile] = useState(null);
  const [completionPreview, setCompletionPreview] = useState('');
  const [completeLoading, setCompleteLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 5. Release Case Modal
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseLoading, setReleaseLoading] = useState(false);

  const fetchCapacity = async () => {
    try {
      const res = await api.get('/engineer/capacity');
      if (res.data?.success) {
        setCapacity(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', '10');
      params.append('tab', currentTab);
      if (search.trim()) params.append('search', search.trim());

      const [resCases] = await Promise.all([
        api.get(`/engineer/mine?${params.toString()}`),
        fetchCapacity(),
      ]);

      if (resCases.data?.success) {
        setCases(resCases.data.data.items);
        setTotal(resCases.data.data.total);
        setTotalPages(resCases.data.data.totalPages);
      }
    } catch (err) {
      addToast('Failed to load engineer cases', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentTab, currentPage, search, addToast]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleTabChange = (tabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabKey);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  // Action handlers
  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      setApproveLoading(true);
      await api.post(`/engineer/complaints/${selectedCase._id}/approve`, { note: approveNote });
      addToast('Ground verification approved! Moved to Work Pending.', 'success');
      setApproveModalOpen(false);
      fetchCases();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleDeny = async (e) => {
    e.preventDefault();
    if (!denyReason.trim() || denyReason.trim().length < 5) {
      addToast('Rejection reason must be at least 5 characters.', 'error');
      return;
    }
    try {
      setDenyLoading(true);
      await api.post(`/engineer/complaints/${selectedCase._id}/deny`, { rejectionReason: denyReason });
      addToast('Complaint denied following ground inspection. Capacity slot freed.', 'warning');
      setDenyModalOpen(false);
      fetchCases();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setDenyLoading(false);
    }
  };

  const handleStartWork = async (e) => {
    e.preventDefault();
    try {
      setStartLoading(true);
      await api.post(`/engineer/complaints/${selectedCase._id}/start`, { note: startNote });
      addToast('Work started on-site! Moved to In Progress.', 'success');
      setStartModalOpen(false);
      fetchCases();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setStartLoading(false);
    }
  };

  const handleCompleteWork = async (e) => {
    e.preventDefault();
    if (!completionNote.trim() || completionNote.trim().length < 5) {
      addToast('Completion note must be between 5 and 500 characters.', 'error');
      return;
    }
    try {
      setCompleteLoading(true);
      const formData = new FormData();
      formData.append('completionNote', completionNote.trim());
      if (completionFile) {
        formData.append('image', completionFile);
      }

      await api.post(`/engineer/complaints/${selectedCase._id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast('Work completed and verified! Capacity slot freed.', 'success');
      setCompleteModalOpen(false);
      setCompletionNote('');
      setCompletionFile(null);
      setCompletionPreview('');
      fetchCases();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleRelease = async (e) => {
    e.preventDefault();
    if (!releaseReason.trim() || releaseReason.trim().length < 5) {
      addToast('Release reason must be at least 5 characters.', 'error');
      return;
    }
    try {
      setReleaseLoading(true);
      await api.post(`/engineer/complaints/${selectedCase._id}/release`, { reason: releaseReason.trim() });
      addToast('Case released back to department verification queue.', 'info');
      setReleaseModalOpen(false);
      fetchCases();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setReleaseLoading(false);
    }
  };

  const columns = [
    {
      header: 'Ticket #',
      key: 'ticketNo',
      className: 'w-36 font-mono font-bold text-slate-900',
      render: (row) => <span>{row.ticketNo}</span>,
    },
    {
      header: 'Evidence',
      key: 'imageUrl',
      className: 'w-16',
      render: (row) =>
        row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt="Evidence"
            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            <FileText className="w-4 h-4" />
          </div>
        ),
    },
    {
      header: 'Description & Location',
      key: 'description',
      className: 'max-w-xs',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-800 font-medium truncate max-w-xs">{row.description}</p>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {row.location?.address}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      className: 'w-36',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'w-64 text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <button
            onClick={() => navigate(`/engineer/complaints/${row._id}`)}
            className="civic-btn-secondary text-xs py-1 px-2"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Actions per tab */}
          {row.status === 'VERIFICATION_IN_PROGRESS' && (
            <>
              <button
                onClick={() => {
                  setSelectedCase(row);
                  setDenyReason('');
                  setDenyModalOpen(true);
                }}
                className="civic-btn-danger text-xs py-1 px-2"
                title="Deny after ground inspection"
              >
                Deny
              </button>
              <button
                onClick={() => {
                  setSelectedCase(row);
                  setReleaseReason('');
                  setReleaseModalOpen(true);
                }}
                className="civic-btn-secondary text-xs py-1 px-2"
                title="Release back to queue"
              >
                Release
              </button>
              <button
                onClick={() => {
                  setSelectedCase(row);
                  setApproveNote('');
                  setApproveModalOpen(true);
                }}
                className="civic-btn-success text-xs py-1 px-2.5"
                title="Approve ground verification"
              >
                Approve
              </button>
            </>
          )}

          {row.status === 'APPROVED' && (
            <button
              onClick={() => {
                setSelectedCase(row);
                setStartNote('');
                setStartModalOpen(true);
              }}
              className="civic-btn-primary text-xs py-1 px-3"
            >
              Start Work
            </button>
          )}

          {row.status === 'WORK_IN_PROGRESS' && (
            <button
              onClick={() => {
                setSelectedCase(row);
                setCompletionNote('');
                setCompletionFile(null);
                setCompletionPreview('');
                setCompleteModalOpen(true);
              }}
              className="civic-btn-success text-xs py-1 px-3"
            >
              Complete Work
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Capacity Progress Bar at the top */}
      <CapacityBar
        maxActiveCases={capacity.maxActiveCases}
        activeCases={capacity.activeCases}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Assigned Cases</h2>
          <p className="text-xs text-slate-500 mt-1">
            Grievances assigned to your engineering desk. Follow the lifecycle from inspection to completion.
          </p>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-1">
        {[
          { key: 'VERIFYING', label: '1. Verifying' },
          { key: 'APPROVED', label: '2. Approved (Work Pending)' },
          { key: 'IN_PROGRESS', label: '3. In Progress' },
          { key: 'COMPLETED', label: '4. Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              currentTab === tab.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={cases}
        loading={loading}
        page={currentPage}
        totalPages={totalPages}
        total={total}
        onPageChange={handlePageChange}
        searchPlaceholder="Search ticket # or location..."
        searchValue={search}
        onSearchChange={setSearch}
        emptyMessage={`No complaints found in '${currentTab}' status.`}
      />

      {/* Modal 1: Approve Ground Verification */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Ground Verification"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleApprove} className="space-y-4">
          <p className="text-xs text-slate-600">
            Confirm that you have physically inspected ticket <span className="font-mono font-bold">{selectedCase?.ticketNo}</span> on-site and verified municipal repair is required.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Note (Optional)</label>
            <textarea
              rows={3}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="e.g. Inspected on-site. Trench dimensions 3x2 meters, requiring asphalt patch."
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setApproveModalOpen(false)} className="civic-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={approveLoading} className="civic-btn-success">
              {approveLoading ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Deny Ground Verification */}
      <Modal
        isOpen={denyModalOpen}
        onClose={() => setDenyModalOpen(false)}
        title="Deny Ground Verification"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDeny} className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            Denying ground verification marks ticket <span className="font-mono font-bold">{selectedCase?.ticketNo}</span> as <span className="font-bold">REJECTED</span> and frees 1 workload capacity slot.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              placeholder="e.g. Visited ground location; issue is on private society driveway outside municipal boundary..."
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setDenyModalOpen(false)} className="civic-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={denyLoading} className="civic-btn-danger">
              {denyLoading ? 'Denying...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Start Work */}
      <Modal
        isOpen={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        title="Initiate On-Site Work"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStartWork} className="space-y-4">
          <p className="text-xs text-slate-600">
            Transition ticket <span className="font-mono font-bold">{selectedCase?.ticketNo}</span> to <span className="font-bold">WORK_IN_PROGRESS</span>. Notifies citizen that municipal machinery/crew is on-site.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Dispatch Note (Optional)</label>
            <textarea
              rows={3}
              value={startNote}
              onChange={(e) => setStartNote(e.target.value)}
              placeholder="e.g. Bitumen roller and 4 field technicians dispatched to station road."
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setStartModalOpen(false)} className="civic-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={startLoading} className="civic-btn-primary">
              {startLoading ? 'Dispatching...' : 'Start On-Site Work'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Complete Work */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Municipal Work"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCompleteWork} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            Completing this case transitions ticket <span className="font-mono font-bold">{selectedCase?.ticketNo}</span> to <span className="font-bold">COMPLETED</span> and frees 1 workload capacity slot.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Completion Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="e.g. Road surface permanently resurfaced with hot-mix asphalt, leveled, and cleared for vehicular traffic."
              className="civic-input"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">5–500 characters</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Completion Photograph (Optional)
            </label>
            {completionPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 h-36 bg-slate-900">
                <img src={completionPreview} alt="Completion" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCompletionFile(null);
                    setCompletionPreview('');
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-slate-900 text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 text-center cursor-pointer text-xs text-slate-500"
              >
                <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                <span>Upload work completion evidence photograph</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCompletionFile(file);
                  setCompletionPreview(URL.createObjectURL(file));
                }
              }}
              className="hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setCompleteModalOpen(false)} className="civic-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={completeLoading} className="civic-btn-success">
              {completeLoading ? 'Completing...' : 'Finalize & Complete'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Release Case */}
      <Modal
        isOpen={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        title="Release Case Back to Queue"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRelease} className="space-y-4">
          <p className="text-xs text-slate-600">
            Releasing ticket <span className="font-mono font-bold">{selectedCase?.ticketNo}</span> clears your assignment, changes status back to <span className="font-bold">VERIFICATION_NEEDED</span>, and frees 1 workload capacity slot.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Release <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="e.g. Reassigned to critical water main break in Ward 2..."
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setReleaseModalOpen(false)} className="civic-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={releaseLoading} className="civic-btn-primary">
              {releaseLoading ? 'Releasing...' : 'Confirm Release'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
