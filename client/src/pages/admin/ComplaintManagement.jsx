import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  UserCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api.js';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { COMPLAINT_STATUS, STATUS_LABELS } from '../../constants/complaintStatus.js';

export const ComplaintManagement = () => {
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Action States
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState(COMPLAINT_STATUS.APPROVED);
  const [overrideExplanation, setOverrideExplanation] = useState('');

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetEngineerId, setTargetEngineerId] = useState('');
  const [forceReassign, setForceReassign] = useState(false);
  const [reassignReason, setReassignReason] = useState('');

  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [deptChangeReason, setDeptChangeReason] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, deptFilter, startDate, endDate]);

  const fetchMetadata = async () => {
    try {
      const [deptRes, staffRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/staff', { params: { role: 'ENGINEER', limit: 100 } }),
      ]);
      setDepartments(deptRes.data.data.items || deptRes.data.data || []);
      setEngineers(staffRes.data.data.items || []);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter,
        departmentId: deptFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
      };
      const res = await api.get('/admin/complaints', { params });
      setComplaints(res.data.data.items || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotalCount(res.data.data.total || 0);
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  // Status Override Submit
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideExplanation.trim() || overrideExplanation.trim().length < 5) {
      addToast('A mandatory administrative explanation (min 5 chars) is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/admin/complaints/${selectedComplaint._id}/status`, {
        targetStatus: overrideStatus,
        explanation: overrideExplanation.trim(),
      });
      addToast('Complaint status successfully overridden with audit trail', 'success');
      setOverrideModalOpen(false);
      setSelectedComplaint(null);
      setOverrideExplanation('');
      fetchComplaints();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to override status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Engineer Reassign Submit
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!targetEngineerId) {
      addToast('Please select a target Joint Engineer', 'error');
      return;
    }
    if (!reassignReason.trim() || reassignReason.trim().length < 5) {
      addToast('Reason is required (min 5 characters)', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/admin/complaints/${selectedComplaint._id}/assign`, {
        engineerId: targetEngineerId,
        force: forceReassign,
        reason: reassignReason.trim(),
      });
      addToast('Engineer successfully reassigned', 'success');
      setReassignModalOpen(false);
      setSelectedComplaint(null);
      setTargetEngineerId('');
      setReassignReason('');
      setForceReassign(false);
      fetchComplaints();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to reassign engineer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Department Transfer Submit
  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    if (!targetDeptId) {
      addToast('Please select a target Department', 'error');
      return;
    }
    if (!deptChangeReason.trim() || deptChangeReason.trim().length < 5) {
      addToast('Reason is required (min 5 characters)', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/admin/complaints/${selectedComplaint._id}/department`, {
        departmentId: targetDeptId,
        reason: deptChangeReason.trim(),
      });
      addToast('Department transferred successfully', 'success');
      setDepartmentModalOpen(false);
      setSelectedComplaint(null);
      setTargetDeptId('');
      setDeptChangeReason('');
      fetchComplaints();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to transfer department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Municipal Complaint Register</h2>
          <p className="text-xs text-slate-500 mt-1">
            Global repository across all civic wards and departments ({totalCount} total cases)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket number (e.g. CMP-2026-000001) or issue keywords..."
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
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="civic-input py-1 px-2.5 text-xs w-auto"
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="civic-input py-1 px-2.5 text-xs w-auto"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Date Range */}
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

          {(statusFilter !== 'ALL' || deptFilter !== 'ALL' || startDate || endDate || search) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setDeptFilter('ALL');
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

      {/* Complaints Table */}
      <div className="civic-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Ticket</th>
                <th className="py-2.5 px-4">Citizen</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Assigned Engineer</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span>Retrieving complaint records...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No complaints found matching the criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      <Link to={`/admin/complaints/${c._id}`} className="hover:underline">
                        {c.ticketNo}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.citizenId?.name || 'Citizen'}</div>
                      <div className="text-[11px] font-mono text-slate-400">{c.citizenId?.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {c.departmentId?.name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      {c.assignedEngineerId ? (
                        <div>
                          <div className="font-semibold text-slate-800">{c.assignedEngineerId.name}</div>
                          <div className="text-[10px] font-mono text-amber-600">{c.assignedEngineerId.staffId}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/complaints/${c._id}`}
                          title="View Full Case Details"
                          className="p-1.5 rounded text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setOverrideStatus(c.status);
                            setOverrideExplanation('');
                            setOverrideModalOpen(true);
                          }}
                          title="Override Complaint Status"
                          className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setTargetEngineerId(c.assignedEngineerId?._id || '');
                            setReassignReason('');
                            setForceReassign(false);
                            setReassignModalOpen(true);
                          }}
                          title="Reassign Engineer"
                          className="p-1.5 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setTargetDeptId(c.departmentId?._id || '');
                            setDeptChangeReason('');
                            setDepartmentModalOpen(true);
                          }}
                          title="Transfer Department"
                          className="p-1.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5" />
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

      {/* Admin Status Override Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => {
          setOverrideModalOpen(false);
          setSelectedComplaint(null);
        }}
        title={`Administrative Status Override - ${selectedComplaint?.ticketNo || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Exceptional Operation</strong>
              This action bypasses standard state machine transitions. It will be recorded permanently in the immutable audit log with your administrative identity.
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Lifecycle Status *</label>
            <select
              value={overrideStatus}
              onChange={(e) => setOverrideStatus(e.target.value)}
              className="civic-input"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v} ({k})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Administrative Reason / Note *
            </label>
            <textarea
              required
              rows={3}
              minLength={5}
              value={overrideExplanation}
              onChange={(e) => setOverrideExplanation(e.target.value)}
              className="civic-input"
              placeholder="Explicit justification for status override (e.g. Commissioner emergency directive, technical re-evaluation)..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setOverrideModalOpen(false);
                setSelectedComplaint(null);
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
              {submitting ? 'Applying Override...' : 'Confirm Status Override'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Engineer Reassignment Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => {
          setReassignModalOpen(false);
          setSelectedComplaint(null);
        }}
        title={`Reassign Joint Engineer - ${selectedComplaint?.ticketNo || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Complaint Department</label>
            <div className="civic-input bg-slate-100 text-slate-700">
              {selectedComplaint?.departmentId?.name || 'Unassigned'}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Joint Engineer *</label>
            <select
              required
              value={targetEngineerId}
              onChange={(e) => setTargetEngineerId(e.target.value)}
              className="civic-input"
            >
              <option value="">Choose Engineer</option>
              {engineers
                .filter(
                  (eng) =>
                    String(eng.departmentId?._id || eng.departmentId) ===
                    String(selectedComplaint?.departmentId?._id || selectedComplaint?.departmentId)
                )
                .map((eng) => (
                  <option key={eng._id} value={eng._id}>
                    {eng.name} ({eng.staffId}) — Active: {eng.activeCases || 0} / {eng.maxActiveCases || 5}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Engineers must belong to the same municipal department.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceReassign}
                onChange={(e) => setForceReassign(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-800">Force Override Capacity</span>
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Check this to assign even if the engineer has currently reached their maximum active caseload.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reassignment Reason *</label>
            <textarea
              required
              rows={2}
              minLength={5}
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="civic-input"
              placeholder="Reason for reassignment (e.g. Leave of absence, workload balance)..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setReassignModalOpen(false);
                setSelectedComplaint(null);
              }}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary text-xs"
            >
              {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Department Modal */}
      <Modal
        isOpen={departmentModalOpen}
        onClose={() => {
          setDepartmentModalOpen(false);
          setSelectedComplaint(null);
        }}
        title={`Transfer Department - ${selectedComplaint?.ticketNo || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDepartmentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Department</label>
            <div className="civic-input bg-slate-100 text-slate-700">
              {selectedComplaint?.departmentId?.name || 'Unassigned'}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Department *</label>
            <select
              required
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="civic-input"
            >
              <option value="">Select Destination Department</option>
              {departments
                .filter(
                  (d) =>
                    d.isActive &&
                    String(d._id) !==
                      String(selectedComplaint?.departmentId?._id || selectedComplaint?.departmentId)
                )
                .map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-amber-600 mt-1">
              Note: Changing department will clear the current engineer assignment and reset verification status if in progress.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transfer Reason *</label>
            <textarea
              required
              rows={2}
              minLength={5}
              value={deptChangeReason}
              onChange={(e) => setDeptChangeReason(e.target.value)}
              className="civic-input"
              placeholder="Reason for administrative transfer..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setDepartmentModalOpen(false);
                setSelectedComplaint(null);
              }}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary text-xs"
            >
              {submitting ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
