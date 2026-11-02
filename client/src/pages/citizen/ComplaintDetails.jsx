import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api.js';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { Timeline } from '../../components/common/Timeline.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/complaints/${id}`);
        if (res.data?.success) {
          setComplaint(res.data.data);
        }
      } catch (err) {
        addToast(err.response?.data?.error?.message || 'Complaint not found', 'error');
        navigate('/citizen/complaints');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, addToast, navigate]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <div className="h-8 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/citizen/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-slate-700">{complaint.ticketNo}</span>
          <StatusBadge status={complaint.internalStatus} isCitizenView={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Evidence Photo & Location */}
        <div className="space-y-6 md:col-span-1">
          {/* Photograph Card */}
          <div className="civic-card p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Submitted Photo Evidence
            </h4>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={complaint.imageUrl}
                alt="Complaint photograph"
                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={() => window.open(complaint.imageUrl, '_blank')}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">Click image to view full size</p>
          </div>

          {/* Department & Location Meta Card */}
          <div className="civic-card p-5 space-y-4 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Department
              </span>
              <p className="text-sm font-semibold text-slate-900">{complaint.department}</p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Date Registered
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
                Address &amp; Landmark
              </span>
              <p className="text-slate-700 leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>{complaint.location?.address}</span>
              </p>
              {complaint.location?.latitude && complaint.location?.longitude && (
                <div className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                  GPS: {complaint.location.latitude}, {complaint.location.longitude}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Complaint Description & Milestone Timeline */}
        <div className="md:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="civic-card p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Citizen Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
              {complaint.description}
            </p>
          </div>

          {/* Vertical Timeline */}
          <Timeline
            events={complaint.timeline || []}
            currentStatus={complaint.internalStatus}
            rejectionReason={complaint.rejectionReason}
            completionNote={complaint.completionNote}
            completionImageUrl={complaint.completionImageUrl}
            isCitizenView={true}
          />
        </div>
      </div>
    </div>
  );
};
