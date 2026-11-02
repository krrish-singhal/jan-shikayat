import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Share2,
  MapPin,
  Calendar,
  Building,
  User,
  Phone,
  FileText,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const OperatorComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptNote, setAcceptNote] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [forwardLoading, setForwardLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [resComp, resDepts] = await Promise.all([
        api.get(`/operator/complaints/${id}`),
        api.get('/departments'),
      ]);

      if (resComp.data?.success) {
        setComplaint(resComp.data.data.complaint);
        setEvents(resComp.data.data.events || []);
      }
      if (resDepts.data?.success) {
        setDepartments(resDepts.data.data);
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || 'Complaint not found', 'error');
      navigate('/operator/complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // A. Handle Accept
  const handleAccept = async (e) => {
    e.preventDefault();
    try {
      setAcceptLoading(true);
      await api.post(`/operator/complaints/${id}/accept`, { note: acceptNote });
      addToast('Complaint accepted and routed to Joint Engineer queue.', 'success');
      setAcceptModalOpen(false);
      navigate('/operator/complaints');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setAcceptLoading(false);
    }
  };

  // B. Handle Reject
  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      addToast('Rejection reason must be at least 5 characters.', 'error');
      return;
    }

    try {
      setRejectLoading(true);
      await api.post(`/operator/complaints/${id}/reject`, { rejectionReason });
      addToast('Complaint has been rejected.', 'warning');
      setRejectModalOpen(false);
      navigate('/operator/complaints');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setRejectLoading(false);
    }
  };

  // C. Handle Forward
  const handleForward = async (e) => {
    e.preventDefault();
    if (!targetDepartmentId) {
      addToast('Please select a destination department.', 'error');
      return;
    }

    try {
      setForwardLoading(true);
      await api.post(`/operator/complaints/${id}/forward`, {
        targetDepartmentId,
        note: forwardNote,
      });
      addToast('Complaint forwarded to destination department successfully.', 'success');
      setForwardModalOpen(false);
      navigate('/operator/complaints');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setForwardLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-8">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!complaint) return null;

  const isSubmitted = complaint.status === 'SUBMITTED';

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/operator/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incoming Queue</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-slate-700">{complaint.ticketNo}</span>
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      {/* Flagged Warning if forwarded > 3 times */}
      {complaint.forwardCount > 3 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold">Administrative Attention Required:</span> This complaint has been forwarded{' '}
            <span className="font-bold underline">{complaint.forwardCount} times</span> across departments.
          </div>
        </div>
      )}

      {/* Action Toolbar for SUBMITTED Complaints */}
      {isSubmitted && (
        <div className="civic-card p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold">Operator Triage Actions</h4>
            <p className="text-xs text-slate-300">Evaluate photo evidence and route complaint to the correct stage</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRejectModalOpen(true)}
              className="civic-btn-danger text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Complaint</span>
            </button>
            <button
              onClick={() => setForwardModalOpen(true)}
              className="civic-btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <Share2 className="w-4 h-4" />
              <span>Forward Dept</span>
            </button>
            <button
              onClick={() => setAcceptModalOpen(true)}
              className="civic-btn-success text-xs px-4 py-2 inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept for Verification</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Photograph & Meta */}
        <div className="space-y-6 md:col-span-1">
          <div className="civic-card p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Submitted Photo Evidence
            </h4>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={complaint.imageUrl}
                alt="Complaint photograph"
                className="w-full h-56 object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.open(complaint.imageUrl, '_blank')}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">Click to open high-res original</p>
          </div>

          <div className="civic-card p-5 space-y-4 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Citizen Informant
              </span>
              <p className="text-sm font-semibold text-slate-900">{complaint.citizenId?.name || 'Citizen'}</p>
              {complaint.citizenId?.phone && (
                <p className="text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {complaint.citizenId.phone}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Department
              </span>
              <p className="text-slate-800 font-medium">{complaint.departmentId?.name}</p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Submission Timestamp
              </span>
              <p className="text-slate-700 font-mono">
                {new Date(complaint.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Reported Location
              </span>
              <p className="text-slate-700 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>{complaint.location?.address}</span>
              </p>
              {complaint.location?.latitude && (
                <p className="font-mono text-slate-500 mt-1">
                  Lat: {complaint.location.latitude}, Lng: {complaint.location.longitude}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Description & Full Audit Event History */}
        <div className="md:col-span-2 space-y-6">
          <div className="civic-card p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Issue Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
              {complaint.description}
            </p>
          </div>

          {/* Event History Trail */}
          <div className="civic-card p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Complaint Event Audit Trail</span>
            </h3>

            <div className="space-y-4">
              {events.map((ev) => (
                <div key={ev._id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {ev.action} • {ev.toStatus}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-700">By:</span> {ev.actorId?.name || 'User'} (
                    {ev.actorId?.role} {ev.actorId?.staffId ? `• ${ev.actorId.staffId}` : ''})
                  </p>
                  {ev.note && <p className="text-slate-500 italic">"{ev.note}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept Complaint for Ground Verification"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAccept} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Accepting this grievance confirms it belongs to <span className="font-bold">{complaint.departmentId?.name}</span> and routes it to the Joint Engineer verification queue.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Acceptance Note</label>
            <textarea
              rows={3}
              value={acceptNote}
              onChange={(e) => setAcceptNote(e.target.value)}
              placeholder="Add instructions or preliminary observation..."
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAcceptModalOpen(false)}
              className="civic-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={acceptLoading}
              className="civic-btn-success"
            >
              {acceptLoading ? 'Accepting...' : 'Confirm & Accept'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Municipal Grievance"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            Rejecting this complaint sets its terminal status to <span className="font-bold">REJECTED</span>. The citizen will be notified with your recorded reason.
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Duplicate complaint, private property outside municipal jurisdiction, fake photo..."
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="civic-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectLoading}
              className="civic-btn-danger"
            >
              {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Forward Modal */}
      <Modal
        isOpen={forwardModalOpen}
        onClose={() => setForwardModalOpen(false)}
        title="Forward Complaint to Destination Department"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleForward} className="space-y-4">
          <p className="text-xs text-slate-600">
            Re-route this grievance to another municipal department desk. The complaint will remain in <span className="font-bold">SUBMITTED</span> status and appear in the destination department queue.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination Department <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={targetDepartmentId}
              onChange={(e) => setTargetDepartmentId(e.target.value)}
              className="civic-input"
            >
              <option value="">-- Choose Department --</option>
              {departments
                .filter((d) => String(d._id) !== String(complaint.departmentId?._id))
                .map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Forwarding Note (Optional)</label>
            <textarea
              rows={2}
              value={forwardNote}
              onChange={(e) => setForwardNote(e.target.value)}
              placeholder="e.g. Broken water pipeline is the root cause of road sinkhole..."
              className="civic-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setForwardModalOpen(false)}
              className="civic-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={forwardLoading}
              className="civic-btn-primary"
            >
              {forwardLoading ? 'Forwarding...' : 'Confirm Forwarding'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
