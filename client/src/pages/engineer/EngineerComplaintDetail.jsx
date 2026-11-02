import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building,
  User,
  Phone,
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { CapacityBar } from '../../components/common/CapacityBar.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const EngineerComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/engineer/complaints/${id}`);
        if (res.data?.success) {
          setComplaint(res.data.data.complaint);
          setEvents(res.data.data.events || []);
        }
      } catch (err) {
        addToast(err.response?.data?.error?.message || 'Complaint not found', 'error');
        navigate('/engineer/my-cases');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-8">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/engineer/my-cases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Cases</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-slate-700">{complaint.ticketNo}</span>
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Photos & Location */}
        <div className="space-y-6 md:col-span-1">
          <div className="civic-card p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Citizen Photo Evidence
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

          {complaint.completionImageUrl && (
            <div className="civic-card p-4 border-emerald-200 bg-emerald-50/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                Completion Evidence Photo
              </h4>
              <div className="rounded-xl overflow-hidden border border-emerald-300 bg-slate-900">
                <img
                  src={complaint.completionImageUrl}
                  alt="Work completion photograph"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          )}

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
                Assigned Engineer
              </span>
              <p className="text-slate-800 font-medium">
                {complaint.assignedEngineerId?.name || 'Unassigned'} {complaint.assignedEngineerId?.staffId ? `(${complaint.assignedEngineerId.staffId})` : ''}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Ground Location
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

            {complaint.completionNote && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block mb-1">
                  Engineer Completion Remarks
                </span>
                <p className="text-sm text-emerald-950">{complaint.completionNote}</p>
              </div>
            )}

            {complaint.rejectionReason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wide block mb-1">
                  Rejection Reason
                </span>
                <p className="text-sm text-red-900">{complaint.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Event History Trail */}
          <div className="civic-card p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Full Event Trail</span>
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
    </div>
  );
};
