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
  ListChecks,
  Search,
  User,
  Sunrise,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { StatusBadge } from '../../components/common/Badge.jsx';
import { TranslatedContent } from '../../components/common/TranslatedContent.jsx';
import { ComplaintImage } from '../../components/common/ComplaintImage.jsx';
import { formatNumber, formatDate, getImageUrl } from '../../utils/formatters.js';

// Returns time-aware greeting + icon
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: Sunrise };
  if (hour < 17) return { text: 'Good Afternoon', icon: Sun };
  return { text: 'Good Evening', icon: Moon };
}

// SVG circular progress ring
function ResolutionRing({ percent }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * (percent / 100);
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke="#FF9933" strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
        {percent}%
      </span>
    </div>
  );
}

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
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Resolution rate = completed / (total - rejected) or 0
  const resolutionRate = stats.total > 0
    ? Math.round(((stats.completed) / Math.max(stats.total - stats.rejected, 1)) * 100)
    : 0;

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
      <div className="civic-card p-6 sm:p-8 bg-gradient-to-br from-[#0f2d5a] via-[#1a3f7a] to-[#1e3a5f] text-white rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Decorative background ring */}
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />
        <div className="absolute -right-4 top-6 w-32 h-32 rounded-full bg-[#FF9933]/10 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10">
          {/* Greeting line with time-aware icon */}
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#FF9933]/90 mb-1">
            <GreetingIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{greeting.text}</span>
            <span className="text-white/30 mx-1">•</span>
            <span className="text-blue-200/70">{t('common:roles.CITIZEN', 'Citizen Portal')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.name || t('common:citizen', 'Citizen')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300/80 mt-2 max-w-xl leading-relaxed">
            {t('dashboardSubtitle', 'Report civic infrastructure issues directly to your municipal corporation. Track ground inspection, field work, and final photo evidence in real time.')}
          </p>
        </div>

        {/* Right side: resolution ring + CTA */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 shrink-0">
          {/* Resolution Rate Ring */}
          {!loading && stats.total > 0 && (
            <div className="flex flex-col items-center gap-1">
              <ResolutionRing percent={resolutionRate} />
              <span className="text-[11px] text-blue-200/70 font-medium whitespace-nowrap">Resolution Rate</span>
            </div>
          )}
          <Link
            to="/citizen/complaints/new"
            className="civic-btn-primary bg-[#FF9933] hover:bg-[#e8882d] active:bg-[#c97320] text-white font-semibold px-5 py-3 text-sm shadow-lg shadow-black/20 self-start sm:self-auto border-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>{t('registerNewComplaint', 'Register New Complaint')}</span>
          </Link>
        </div>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/citizen/complaints/new"
          className="civic-card p-4 flex items-center gap-3.5 hover:border-brand-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-150 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">New Grievance</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Report a civic issue</p>
          </div>
        </Link>
        <Link
          to="/citizen/complaints"
          className="civic-card p-4 flex items-center gap-3.5 hover:border-brand-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-150 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50 shrink-0 group-hover:scale-110 transition-transform">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">My Complaints</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track all your tickets</p>
          </div>
        </Link>
        <Link
          to="/citizen/profile"
          className="civic-card p-4 flex items-center gap-3.5 hover:border-brand-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-150 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/50 shrink-0 group-hover:scale-110 transition-transform">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">My Profile</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">View &amp; update details</p>
          </div>
        </Link>
      </div>

      {/* Recent Complaints Section */}
      <div className="civic-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('myComplaintsTitle', 'Recent Complaints')}</h3>
              {/* Pulsing live indicator */}
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('myComplaintsSubtitle', 'Your most recently submitted municipal issues')}</p>
          </div>
          <Link
            to="/citizen/complaints"
            className="text-xs font-semibold text-brand-600 dark:text-blue-400 hover:text-brand-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            <span>{t('common:viewDetails', 'View All')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('common:noResultsFound', 'You have not filed any complaints yet.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recent.map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => navigate(`/citizen/complaints/${complaint._id}`)}
                className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <ComplaintImage
                    src={complaint.imageUrl}
                    alt={complaint.ticketNo || 'Thumbnail'}
                    className="w-12 h-12 rounded-lg"
                    iconSize="w-5 h-5"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {complaint.ticketNo}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {t(`common:departments.${complaint.department}`, complaint.department)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-md mt-0.5">
                      <TranslatedContent text={complaint.description} complaintId={complaint._id} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
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
