import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  Wrench,
  Award,
  XCircle,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { formatNumber, formatDate } from '../../utils/formatters.js';

export const CitizenDashboard = () => {
  const { t, i18n } = useTranslation(['citizen', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/citizen/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load citizen stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="civic-card p-6 sm:p-8 bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 text-white rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-300">
            {t('common:roles.CITIZEN', 'Citizen')} • {t('dashboardTitle', 'Grievance Redressal Portal')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {t('common:welcome', 'Welcome')}, {user?.name || t('common:citizen', 'Citizen')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            {t('dashboardSubtitle', 'Report civic infrastructure issues directly to your municipal corporation. Track ground inspection, field work, and final photo evidence in real time.')}
          </p>
        </div>

        <Link
          to="/citizen/complaints/new"
          className="civic-btn-primary bg-white text-brand-800 hover:bg-slate-100 font-semibold px-5 py-3 text-sm shrink-0 shadow-lg shadow-black/10 self-start md:self-auto"
        >
          <PlusCircle className="w-5 h-5 text-brand-700" />
          <span>{t('registerNewComplaint', 'Register New Complaint')}</span>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title={t('totalComplaints', 'Total Complaints')}
          value={loading ? '—' : formatNumber(stats.total, i18n.language)}
          subtitle={t('common:all', 'All complaints')}
          icon={FileText}
          color="blue"
          onClick={() => navigate('/citizen/complaints')}
        />
        <StatCard
          title={t('pendingReview', 'Pending Review')}
          value={loading ? '—' : formatNumber(stats.pending, i18n.language)}
          subtitle={t('common:statusMap.PENDING', 'Under review')}
          icon={Clock}
          color="amber"
          onClick={() => navigate('/citizen/complaints?status=Pending')}
        />
        <StatCard
          title={t('common:statusMap.APPROVED', 'Approved')}
          value={loading ? '—' : formatNumber(stats.approved, i18n.language)}
          subtitle={t('common:statusMap.APPROVED', 'Site verified')}
          icon={CheckCircle2}
          color="purple"
          onClick={() => navigate('/citizen/complaints?status=Approved')}
        />
        <StatCard
          title={t('workInProgress', 'Work in Progress')}
          value={loading ? '—' : formatNumber(stats.inProgress, i18n.language)}
          subtitle={t('common:statusMap.WORK_IN_PROGRESS', 'Crew working')}
          icon={Wrench}
          color="blue"
          onClick={() => navigate('/citizen/complaints?status=Work in Progress')}
        />
        <StatCard
          title={t('resolvedComplaints', 'Completed')}
          value={loading ? '—' : formatNumber(stats.completed, i18n.language)}
          subtitle={t('common:statusMap.COMPLETED', 'Resolution verified')}
          icon={Award}
          color="emerald"
          onClick={() => navigate('/citizen/complaints?status=Completed')}
        />
        <StatCard
          title={t('common:statusMap.REJECTED', 'Rejected')}
          value={loading ? '—' : formatNumber(stats.rejected, i18n.language)}
          subtitle={t('common:statusMap.REJECTED', 'Outside jurisdiction')}
          icon={XCircle}
          color="red"
          onClick={() => navigate('/citizen/complaints?status=Rejected')}
        />
      </div>

      {/* Recent Complaints Section */}
      <div className="civic-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('myComplaintsTitle', 'Recent Complaints')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('myComplaintsSubtitle', 'Your most recently submitted municipal issues')}</p>
          </div>
          <Link
            to="/citizen/complaints"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            <span>{t('common:viewDetails', 'View All')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm text-slate-500 font-medium">{t('common:noResultsFound', 'You have not filed any complaints yet.')}</p>
            <Link to="/citizen/complaints/new" className="civic-btn-primary mt-3 text-xs">
              {t('registerNewComplaint', 'File Your First Complaint')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recent.map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => navigate(`/citizen/complaints/${complaint._id}`)}
                className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {complaint.imageUrl ? (
                    <img
                      src={complaint.imageUrl}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {complaint.ticketNo}
                      </span>
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {complaint.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-md mt-0.5">
                      {complaint.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {formatDate(complaint.createdAt, i18n.language)}
                  </span>
                  <StatusBadge status={complaint.status} isCitizenView={true} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
