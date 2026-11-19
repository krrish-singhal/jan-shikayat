import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  PlusCircle,
  Shield,
  Building2,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  Droplets,
  Truck,
  Lightbulb,
  HeartPulse,
  Zap,
  Phone,
  Layers,
  TrendingUp,
  Users,
  CheckCheck,
  Timer,
  Edit,
  Megaphone,
  AlertTriangle,
  Pin,
  Target,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';

export const HomePage = () => {
  const { t } = useTranslation(['common', 'auth', 'citizen', 'operator', 'engineer', 'admin']);
  const { user, defaultDashboard } = useAuth();
  const navigate = useNavigate();

  const [ticketSearch, setTicketSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [notices, setNotices] = useState([
    { id: 'default-1', date: '15 Nov 2026', text: 'Online grievance submission portal updated with multi-language support.' },
    { id: 'default-2', date: '10 Nov 2026', text: 'New SLA: Road & Pothole complaints resolved within 5 working days.' },
    { id: 'default-3', date: '05 Nov 2026', text: 'Scheduled maintenance: Water supply disruption on 20 Nov (6–10 AM).' },
    { id: 'default-4', date: '01 Nov 2026', text: 'Field engineers to upload geo-tagged photos for all closed complaints.' },
    { id: 'default-5', date: '28 Oct 2026', text: 'Citizen charter revised — download the updated PDF from the helpdesk.' },
  ]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/notices');
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setNotices(
            res.data.data.map((item) => ({
              id: item._id,
              date: item.date || new Date(item.createdAt).toLocaleDateString(),
              text: item.title,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load notices from server:', err);
      }
    };
    fetchNotices();
  }, []);

  /* ── existing tracker handler — untouched ─────────────────────────── */
  const handleTrackComplaint = async (e) => {
    e.preventDefault();
    if (!ticketSearch.trim()) return;

    setSearching(true);
    setSearchError('');

    try {
      if (user?.role === 'CITIZEN') {
        const res = await api.get(`/complaints?search=${encodeURIComponent(ticketSearch.trim())}`);
        const found = res.data?.data?.items?.[0];
        if (found) {
          navigate(`/citizen/complaints/${found._id}`);
          return;
        }
      }
      setSearchError(t('auth:loginToTrackError', 'To view complete ground inspection evidence and timeline, please log in with your citizen credentials.'));
    } catch (err) {
      setSearchError(t('auth:ticketNotFoundError', 'Unable to locate complaint with this ticket number.'));
    } finally {
      setSearching(false);
    }
  };

  /* ── portal cards (existing data, only styles changed) ───────────── */
  const portalCards = [
    {
      role: t('auth:citizenLoginTitle', 'Citizen Grievance Portal'),
      desc: t('citizen:dashboardSubtitle', 'Lodge civic grievances with photograph evidence and GPS location. Monitor resolution milestones on a real-time vertical timeline.'),
      icon: PlusCircle,
      link: user?.role === 'CITIZEN' ? '/citizen/dashboard' : '/login',
      chipBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200',
      iconBg: 'bg-[#1F3A6E] dark:bg-blue-700',
      borderAccent: 'border-l-4 border-l-[#1F3A6E]',
      badgeText: t('common:roles.CITIZEN', 'Citizen'),
      actionText: t('auth:loginButton', 'Enter Citizen Portal'),
    },
    {
      role: t('operator:dashboardTitle', 'Department Operator Desk'),
      desc: t('operator:dashboardSubtitle', 'Process incoming departmental queues (FIFO oldest first), inspect citizen evidence, reject invalid complaints, or accept for field inspection.'),
      icon: Building2,
      link: user?.role === 'OPERATOR' ? '/operator/dashboard' : '/staff/login',
      chipBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200',
      iconBg: 'bg-amber-600 dark:bg-amber-700',
      borderAccent: 'border-l-4 border-l-amber-500',
      badgeText: t('common:roles.OPERATOR', 'Operator'),
      actionText: t('operator:incomingQueueCount', 'Access Desk Queue'),
    },
    {
      role: t('engineer:dashboardTitle', 'Joint Engineer Field Console'),
      desc: t('engineer:dashboardSubtitle', 'Pick up complaints with atomic capacity controls, perform on-site verification, start repair work, and submit completion photographs.'),
      icon: Wrench,
      link: user?.role === 'ENGINEER' ? '/engineer/dashboard' : '/staff/login',
      chipBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200',
      iconBg: 'bg-[#138808] dark:bg-emerald-700',
      borderAccent: 'border-l-4 border-l-[#138808]',
      badgeText: t('common:roles.ENGINEER', 'Field Engineer'),
      actionText: t('engineer:queueTitle', 'Open Field Console'),
    },
    {
      role: t('admin:dashboardTitle', 'Municipal Admin Command Center'),
      desc: t('admin:dashboardSubtitle', 'Platform-wide governance, real-time analytics, staff provisioning with auto-generated IDs, department management, and immutable audit logs.'),
      icon: Shield,
      link: user?.role === 'ADMIN' ? '/admin/dashboard' : '/staff/login',
      chipBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200',
      iconBg: 'bg-purple-700 dark:bg-purple-800',
      borderAccent: 'border-l-4 border-l-purple-600',
      badgeText: t('common:roles.ADMIN', 'Administrator'),
      actionText: t('admin:dashboardTitle', 'Launch Admin Console'),
    },
  ];

  /* ── civic departments (existing data) ───────────────────────────── */
  const civicDepartments = [
    { name: t('common:deptRoads', 'Roads & Potholes'), icon: Layers, desc: t('common:deptRoadsDesc', 'Pavement restoration, potholes repair, asphalt overlay') },
    { name: t('common:deptWater', 'Water Supply'), icon: Droplets, desc: t('common:deptWaterDesc', 'Pipeline leakage, potable water distribution, pressure drop') },
    { name: t('common:deptSanitation', 'Sanitation & Solid Waste'), icon: Truck, desc: t('common:deptSanitationDesc', 'Garbage clearance, community bin maintenance, segregation') },
    { name: t('common:deptLighting', 'Street Lighting'), icon: Lightbulb, desc: t('common:deptLightingDesc', 'Defective street lamps, timer switches, pole maintenance') },
    { name: t('common:deptElectricity', 'Electricity & Utilities'), icon: Zap, desc: t('common:deptElectricityDesc', 'Cable hazard mitigation, transformer clearing, feeder issues') },
    { name: t('common:deptHealth', 'Public Health & Hygiene'), icon: HeartPulse, desc: t('common:deptHealthDesc', 'Vector control, fogging, open drain disinfestation') },
  ];

  /* ── static stats strip — TODO: replace with real API data if available */
  const stats = [
    { label: 'Grievances Received', value: '1,24,587', icon: FileText, color: 'text-[#FF9933]' },
    { label: 'Resolved', value: '1,09,342', icon: CheckCheck, color: 'text-[#138808]' },
    { label: 'Pending', value: '15,245', icon: Timer, color: 'text-amber-400' },
    { label: 'Avg. Resolution', value: '4.2 days', icon: TrendingUp, color: 'text-blue-300' },
  ];



  return (
    <div className="gov-page-bg dark:bg-slate-950 pb-8">

      {/* ════════════════════════════════════════════════════════════════
          IDEA 2 — TICKER + HERO TWO-COLUMN
      ═══════════════════════════════════════════════════════════════ */}

      {/* 2-a Announcement ticker */}
      <div className="bg-white dark:bg-slate-900 border-b border-[#CFD6E4] dark:border-slate-800 py-1.5 px-0">
        <div className="max-w-7xl mx-auto flex items-center gap-0">
          {/* "Latest" badge */}
          <div
            className="shrink-0 bg-[#FF9933] text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 mr-3"
            aria-label="Latest announcements"
          >
            Latest
          </div>
          {/* Scrolling ticker */}
          <div className="gov-ticker-wrap flex-1 overflow-hidden" role="marquee" aria-live="off">
            <div className="gov-ticker-track text-xs font-medium text-[#1F3A6E] dark:text-blue-200 gap-10">
              <span className="inline-flex items-center px-4">
                <Megaphone className="w-3.5 h-3.5 text-[#FF9933] mr-1.5 shrink-0" aria-hidden="true" />
                New water supply pipeline commissioned in Ward 12 — complaints resolved faster
              </span>
              <span className="inline-flex items-center px-4">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mr-1.5 shrink-0" aria-hidden="true" />
                Scheduled road maintenance: MG Road stretch closed on 22 Nov 2026 (10 AM – 6 PM)
              </span>
              <span className="inline-flex items-center px-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5 shrink-0" aria-hidden="true" />
                Citizens can now attach up to 5 photographs per grievance submission
              </span>
              <span className="inline-flex items-center px-4">
                <Pin className="w-3.5 h-3.5 text-blue-500 mr-1.5 shrink-0" aria-hidden="true" />
                Public Health drive: Fogging operations in Wards 3, 7, 11 this week
              </span>
              <span className="inline-flex items-center px-4">
                <Target className="w-3.5 h-3.5 text-rose-500 mr-1.5 shrink-0" aria-hidden="true" />
                Target: 95% grievances resolved within SLA by Q4 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-b Hero + Notice board two-column row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: navy hero banner (2/3 width) */}
          <div className="lg:col-span-2 bg-[#1F3A6E] dark:bg-[#1F2F4D] rounded-[4px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
            {/* Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-white/10 border border-white/20 text-white text-xs font-semibold mb-4">
                <Shield className="w-3.5 h-3.5 text-[#FF9933]" aria-hidden="true" />
                <span>{t('common:officialPortal', 'Official Municipal Citizen Grievance Portal')}</span>
              </div>

              {/* Hero title */}
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
                {t('auth:homeHeroTitle', 'Transparent, Time-Bound Redressal of Municipal Grievances')}
              </h1>
              <p className="text-sm text-blue-100/80 dark:text-blue-100/70 mt-3 max-w-xl leading-relaxed">
                {t('auth:homeHeroSubtitle', 'Directly connect with your local Municipal Corporation. Register grievances, track departmental ground verification, and inspect completed civic maintenance.')}
              </p>
            </div>

            {/* Ticket tracker box — existing form + handler, unchanged logic */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[4px] border border-[#CFD6E4] dark:border-slate-700 text-left space-y-3 shadow-sm">
              <label
                htmlFor="ticket-tracker-input"
                className="block text-xs font-bold uppercase tracking-wider text-[#1F3A6E] dark:text-blue-300"
              >
                {t('common:ticketNo', 'Ticket')} {t('common:statusTracker', 'Status Tracker')}
              </label>

              <form onSubmit={handleTrackComplaint} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="ticket-tracker-input"
                    type="text"
                    required
                    placeholder={t('citizen:searchPlaceholder', 'Enter Ticket Number (e.g. CMP-2026-000001)...')}
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="civic-input pl-10 text-xs sm:text-sm font-mono w-full"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="civic-btn-primary text-xs sm:text-sm whitespace-nowrap min-h-[42px] sm:min-h-0 !bg-[#FF9933] hover:!bg-[#e67300] !text-slate-900 font-bold"
                >
                  {searching ? t('common:loading', 'Checking Records...') : t('common:search', 'Track Ticket')}
                </button>
              </form>

              {searchError && (
                <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-sm border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <span>{searchError}</span>
                    <div className="mt-1">
                      <Link to="/login" className="font-bold underline text-[#1F3A6E] dark:text-blue-400">
                        {t('auth:clickHereToLogin', 'Click here to Login')}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Notice board (1/3 width) */}
          <aside
            className="gov-notice-board flex flex-col overflow-hidden shadow-sm"
            aria-label="Official notice board"
          >
            {/* Notice board header */}
            <div className="bg-[#1F3A6E] dark:bg-[#1F2F4D] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF9933]" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  Notice Board
                </span>
              </div>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin/notices"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF9933] hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                  title="Manage and Edit Notices in Admin Console"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </Link>
              )}
            </div>

            {/* Notice items — scrollable, fills remaining height */}
            <ul className="flex-1 divide-y divide-[#CFD6E4] dark:divide-slate-700 overflow-y-auto">
              {notices.map((n, i) => (
                <li key={n.id || i} className="px-4 py-2.5 hover:bg-[#F4F6FB] dark:hover:bg-slate-800 transition-colors">
                  <span className="text-[10px] text-[#FF9933] font-semibold block mb-0.5">{n.date}</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{n.text}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          IDEA 3-a — DEDICATED PORTALS (4-col flat tiles)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4" aria-labelledby="portals-heading">
        {/* Section header */}
        <div className="mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF9933] bg-[#FF9933]/10 border border-[#FF9933]/30 px-2.5 py-1 rounded-sm">
            {t('auth:integratedArchitecture', 'Integrated Governance Architecture')}
          </span>
          <h2
            id="portals-heading"
            className="text-lg sm:text-xl font-bold text-[#1F3A6E] dark:text-slate-100 mt-2"
          >
            {t('auth:dedicatedPortalsTitle', 'Dedicated Portals for Citizens, Operators, Engineers & Administrators')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('auth:dedicatedPortalsSubtitle', 'All four operational branches coordinate on the same real-time municipal database records.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portalCards.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <div
                key={idx}
                className={`civic-card flex flex-col justify-between p-5 hover:shadow-md transition-shadow ${portal.borderAccent}`}
              >
                <div className="space-y-3">
                  {/* Icon + role chip */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-sm ${portal.iconBg} text-white flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      <Icon className="w-5 h-5 text-[#FF9933]" />
                    </div>
                    {/* label chip */}
                    <span className={`gov-role-chip ${portal.chipBg}`}>
                      {portal.badgeText}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {portal.role}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {portal.desc}
                    </p>
                  </div>
                </div>

                {/* Action button — existing Link + route */}
                <div className="pt-4 mt-4 border-t border-[#CFD6E4] dark:border-slate-800">
                  <Link
                    to={portal.link}
                    className="w-full civic-btn-secondary text-xs flex items-center justify-between group !rounded-sm"
                  >
                    <span>{portal.actionText}</span>
                    <ArrowRight
                      className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1F3A6E] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          IDEA 3-b — MUNICIPAL DIVISIONS (3×2 flat grid)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4" aria-labelledby="divisions-heading">
        <div className="bg-white dark:bg-slate-900 border border-[#CFD6E4] dark:border-slate-800 rounded-[4px] p-5 sm:p-6 shadow-sm">
          <div className="mb-5">
            <h3
              id="divisions-heading"
              className="text-base sm:text-lg font-bold text-[#1F3A6E] dark:text-slate-100"
            >
              {t('common:activeDivisionsTitle', 'Active Municipal Redressal Divisions')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('common:activeDivisionsSubtitle', 'Citizen complaints are routed directly to designated departmental intake desks.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {civicDepartments.map((dept, idx) => {
              const DeptIcon = dept.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-[#F4F6FB] dark:bg-slate-800/80 border border-[#CFD6E4] dark:border-slate-700 flex items-start gap-3 transition-colors hover:bg-white dark:hover:bg-slate-800"
                  style={{ borderRadius: '4px' }}
                >
                  <div
                    className="w-8 h-8 rounded-sm bg-[#1F3A6E]/10 dark:bg-blue-950 text-[#1F3A6E] dark:text-blue-400 flex items-center justify-center shrink-0 border border-[#1F3A6E]/20 dark:border-blue-900"
                    aria-hidden="true"
                  >
                    <DeptIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{dept.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{dept.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          IDEA 3-c — STATISTICS STRIP
      ═══════════════════════════════════════════════════════════════ */}
      <div className="gov-stat-strip dark:bg-[#1a2744] py-5 my-4" role="region" aria-label="Platform statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* TODO: replace static values with real API data when available */}
            {stats.map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-sm bg-white/10 flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <SIcon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className={`text-xl font-extrabold ${s.color} leading-tight`}>{s.value}</div>
                    <div className="text-[11px] text-blue-200/70 uppercase tracking-wide">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          IDEA 4 — SLA BANNER (white card, blue left border)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-2" aria-labelledby="sla-heading">
        <div className="gov-sla-card p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Text block */}
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F3A6E] dark:text-blue-300 uppercase tracking-wide">
              <Clock className="w-4 h-4 text-[#FF9933]" aria-hidden="true" />
              <span id="sla-heading">{t('auth:slaTitle', 'Standard Service Level Guarantee (SLA)')}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('auth:slaHeading', 'Guaranteed Initial Departmental Review within 48 Hours')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {t('auth:slaDesc', 'Every submitted grievance is assigned a permanent tracking ticket. Cases pending verification beyond 7 days are automatically escalated to the Municipal Commissioner oversight queue.')}
            </p>
          </div>

          {/* Buttons — existing routes + handlers, stacked */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto md:w-48">
            {/* Keep existing Link to="/signup" with existing text */}
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-sm bg-[#FF9933] hover:bg-[#e67300] text-slate-900 font-bold text-xs uppercase tracking-wide text-center transition-colors shadow-sm"
            >
              {t('common:registerComplaint', 'File New Grievance')}
            </Link>
            {/* Keep existing Link to="/login" with existing text */}
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-sm bg-[#1F3A6E] hover:bg-[#1F2F4D] text-white font-semibold text-xs border border-[#1F3A6E] text-center transition-colors dark:border-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700"
            >
              {t('auth:trackGrievance', 'Track Grievance')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
