import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  User,
  Shield,
  Clock,
  ShieldAlert,
  UserCheck,
  Building2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import api from '../../services/api.js';
import { Badge } from '../../components/common/Badge.jsx';
import { Timeline } from '../../components/common/Timeline.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { COMPLAINT_STATUS, STATUS_LABELS } from '../../constants/complaintStatus.js';

export const AdminComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [events, setEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
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
    fetchComplaint();
    fetchMetadata();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/complaints/${id}`);
      setComplaint(res.data.data.complaint);
      setEvents(res.data.data.events || []);
      setAuditLogs(res.data.data.auditLogs || []);
      if (res.data.data.complaint) {
        setOverrideStatus(res.data.data.complaint.status);
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to load complaint', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideExplanation.trim() || overrideExplanation.trim().length < 5) {
      addToast('A mandatory administrative explanation (min 5 chars) is required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/admin/complaints/${id}/status`, {
        targetStatus: overrideStatus,
        explanation: overrideExplanation.trim(),
      });
      addToast('Status overridden successfully with audit record', 'success');
      setOverrideModalOpen(false);
      setOverrideExplanation('');
      fetchComplaint();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to override status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
      await api.patch(`/admin/complaints/${id}/assign`, {
        engineerId: targetEngineerId,
        force: forceReassign,
        reason: reassignReason.trim(),
      });
      addToast('Engineer successfully reassigned', 'success');
      setReassignModalOpen(false);
      setTargetEngineerId('');
      setReassignReason('');
      setForceReassign(false);
      fetchComplaint();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to reassign engineer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
      await api.patch(`/admin/complaints/${id}/department`, {
        departmentId: targetDeptId,
        reason: deptChangeReason.trim(),
      });
      addToast('Department transferred successfully', 'success');
      setDepartmentModalOpen(false);
      setTargetDeptId('');
      setDeptChangeReason('');
      fetchComplaint();
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Failed to transfer department', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading administrative dossier...</span>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="civic-card p-8 text-center text-xs text-slate-500 space-y-3">
        <p>Complaint record not found or inaccessible.</p>
        <Link to="/admin/complaints" className="civic-btn-secondary text-xs inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/complaints')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-slate-900">{complaint.ticketNo}</span>
              <Badge status={complaint.status} />
              {complaint.forwardCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Forwarded {complaint.forwardCount}x
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Logged on {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Administrative Command Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setOverrideStatus(complaint.status);
              setOverrideExplanation('');
              setOverrideModalOpen(true);
            }}
            className="civic-btn-secondary text-xs text-rose-700 border-rose-200 hover:bg-rose-50 inline-flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Override Status</span>
          </button>
          <button
            onClick={() => {
              setTargetEngineerId(complaint.assignedEngineerId?._id || '');
              setReassignReason('');
              setForceReassign(false);
              setReassignModalOpen(true);
            }}
            className="civic-btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Reassign Engineer</span>
          </button>
          <button
            onClick={() => {
              setTargetDeptId('');
              setDeptChangeReason('');
              setDepartmentModalOpen(true);
            }}
            className="civic-btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transfer Dept</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Evidence & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Case Dossier Card */}
          <div className="civic-card p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Complaint Description &amp; Ground Evidence
            </h3>

            {/* Complaint Image */}
            {complaint.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-96 flex items-center justify-center">
                <img
                  src={complaint.imageUrl}
                  alt="Ground complaint condition"
                  className="w-full h-full object-cover max-h-96"
                />
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Citizen Narrative
              </span>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {complaint.description}
              </p>
            </div>

            {/* Location */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-400 block mb-1">Reported Address</span>
                <p className="text-slate-800 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{complaint.location?.address || 'Street address unspecified'}</span>
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block mb-1">GPS Coordinates</span>
                <p className="font-mono text-slate-700">
                  {complaint.location?.latitude && complaint.location?.longitude
                    ? `${complaint.location.latitude}, ${complaint.location.longitude}`
                    : 'Coordinates unavailable'}
                </p>
              </div>
            </div>

            {/* Completion Evidence if COMPLETED */}
            {complaint.status === COMPLAINT_STATUS.COMPLETED && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Resolution Completion Dossier
                </div>
                {complaint.completionImageUrl && (
                  <div className="rounded-lg overflow-hidden border border-emerald-200 max-h-64">
                    <img
                      src={complaint.completionImageUrl}
                      alt="Work Completion Verification"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-emerald-800 block mb-1">
                    Engineer Completion Note
                  </span>
                  <p className="text-xs text-emerald-900 bg-white/80 p-3 rounded-lg border border-emerald-200">
                    {complaint.completionNote || 'Work executed and verified by engineering team.'}
                  </p>
                </div>
              </div>
            )}

            {/* Rejection Note if REJECTED */}
            {complaint.status === COMPLAINT_STATUS.REJECTED && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-rose-900 block">
                  Ground Rejection Reason
                </span>
                <p className="text-xs text-rose-800 bg-white/80 p-3 rounded-lg border border-rose-200">
                  {complaint.rejectionReason || 'Complaint rejected.'}
                </p>
              </div>
            )}
          </div>

          {/* Audit Logs Table for this Complaint */}
          <div className="civic-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Immutable Audit Trail</h3>
                <p className="text-[11px] text-slate-400">Security event logging for complaint #{complaint.ticketNo}</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{auditLogs.length} events logged</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Official / Actor</th>
                    <th className="py-2.5 px-4">Notes</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No external audit actions recorded.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                          {log.action}
                          {log.isAdminOverride && (
                            <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-rose-100 text-rose-700 font-bold rounded">
                              ADMIN OVERRIDE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-800">{log.actorName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{log.actorRole}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">{log.notes || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Citizen info, Department, Engineer, Timeline */}
        <div className="space-y-6">
          {/* Municipal Authority Context Card */}
          <div className="civic-card p-5 space-y-4 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Assigned Municipal Authority
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                  <span className="font-semibold text-slate-900">{complaint.departmentId?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Joint Engineer</span>
                  {complaint.assignedEngineerId ? (
                    <div>
                      <span className="font-semibold text-slate-900">{complaint.assignedEngineerId.name}</span>
                      <span className="block text-[11px] font-mono text-slate-400">
                        {complaint.assignedEngineerId.staffId} • {complaint.assignedEngineerId.phone || 'No phone'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No field engineer picked yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Citizen Dossier Card */}
          <div className="civic-card p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Citizen Information</h4>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Citizen Name</span>
                <span className="font-semibold text-slate-900">{complaint.citizenId?.name || 'Citizen'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Email</span>
                <span className="font-mono text-slate-800">{complaint.citizenId?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                <span className="font-mono text-slate-800">{complaint.citizenId?.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Citizen Status</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    complaint.citizenId?.isBlocked
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {complaint.citizenId?.isBlocked ? 'Blocked Citizen' : 'Active Citizen'}
                </span>
              </div>
            </div>
          </div>

          {/* Vertical Lifecycle Timeline */}
          <div className="civic-card p-5 space-y-4">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Lifecycle Progression
            </h4>
            <Timeline currentStatus={complaint.status} events={events} />
          </div>
        </div>
      </div>

      {/* Admin Status Override Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title={`Status Override - ${complaint.ticketNo}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Exceptional Operation</strong>
              Bypasses normal state machine transition table. Recorded permanently in audit logs.
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Status *</label>
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
              placeholder="Explicit justification for status override..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOverrideModalOpen(false)}
              className="civic-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="civic-btn-primary bg-rose-600 hover:bg-rose-700 text-xs"
            >
              {submitting ? 'Applying...' : 'Apply Status Override'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Engineer Reassignment Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={`Reassign Joint Engineer - ${complaint.ticketNo}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department</label>
            <div className="civic-input bg-slate-100 text-slate-700">
              {complaint.departmentId?.name || 'Unassigned'}
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
                    String(complaint.departmentId?._id || complaint.departmentId)
                )
                .map((eng) => (
                  <option key={eng._id} value={eng._id}>
                    {eng.name} ({eng.staffId}) — Active: {eng.activeCases || 0} / {eng.maxActiveCases || 5}
                  </option>
                ))}
            </select>
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
              Assign even if the engineer has currently reached their maximum active caseload.
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
              placeholder="Reason for reassignment..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
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
        onClose={() => setDepartmentModalOpen(false)}
        title={`Transfer Department - ${complaint.ticketNo}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleDepartmentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Department</label>
            <div className="civic-input bg-slate-100 text-slate-700">
              {complaint.departmentId?.name || 'Unassigned'}
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
                    String(d._id) !== String(complaint.departmentId?._id || complaint.departmentId)
                )
                .map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
            </select>
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
              onClick={() => setDepartmentModalOpen(false)}
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
