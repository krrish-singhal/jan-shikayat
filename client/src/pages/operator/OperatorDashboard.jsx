import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Share2,
  Clock,
  ArrowRight,
  Building,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';

export const OperatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    department: null,
    totalIncoming: 0,
    pendingReview: 0,
    accepted: 0,
    rejected: 0,
    forwarded: 0,
    recentHandled: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/operator/dashboard');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load operator stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Department Status Header */}
      <div className="civic-card p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Department Desk Active
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1 text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-400" />
            <span>{stats.department?.name || user?.departmentId?.name || 'Department Desk'}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Operator Staff ID: <span className="font-mono font-bold text-white">{user?.staffId}</span> | Operator: {user?.name}
          </p>
        </div>

        <Link
          to="/operator/complaints"
          className="civic-btn-primary bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-2.5 text-xs sm:text-sm shrink-0 shadow-lg shadow-black/20"
        >
          <Inbox className="w-4 h-4" />
          <span>Open Incoming Queue ({stats.totalIncoming})</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Incoming Queue"
          value={loading ? '—' : stats.totalIncoming}
          subtitle="FIFO oldest-first"
          icon={Inbox}
          color="amber"
          onClick={() => navigate('/operator/complaints')}
        />
        <StatCard
          title="Pending Review"
          value={loading ? '—' : stats.pendingReview}
          subtitle="Awaiting action"
          icon={Clock}
          color="blue"
          onClick={() => navigate('/operator/complaints')}
        />
        <StatCard
          title="Accepted"
          value={loading ? '—' : stats.accepted}
          subtitle="Routed to engineers"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Forwarded"
          value={loading ? '—' : stats.forwarded}
          subtitle="Cross-department"
          icon={Share2}
          color="purple"
        />
        <StatCard
          title="Rejected"
          value={loading ? '—' : stats.rejected}
          subtitle="Invalid / duplicates"
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Recently Handled Complaints Card */}
      <div className="civic-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recently Handled Complaints</h3>
            <p className="text-xs text-slate-500 mt-0.5">Complaints processed by your desk session</p>
          </div>
          <Link
            to="/operator/history"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            <span>Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.recentHandled.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No complaints processed yet in this operator session.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentHandled.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/operator/complaints/${item.complaintId}`)}
                className="py-3 px-3 -mx-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {item.ticketNo}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      Action: {item.action}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Citizen: {item.citizenName} {item.note ? `• Remarks: ${item.note}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {new Date(item.actionDate).toLocaleDateString()}
                  </span>
                  <StatusBadge status={item.currentStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
