import React, { useState } from 'react';
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
  HelpCircle,
  Layers,
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
      setSearchError('To view complete ground inspection evidence and timeline, please log in with your citizen credentials.');
    } catch (err) {
      setSearchError('Unable to locate complaint with this ticket number.');
    } finally {
      setSearching(false);
    }
  };

  const portalCards = [
    {
      role: t('auth:citizenLoginTitle', 'Citizen Grievance Portal'),
      desc: t('citizen:dashboardSubtitle', 'Lodge civic grievances with photograph evidence and GPS location. Monitor resolution milestones on a real-time vertical timeline.'),
      icon: PlusCircle,
      link: user?.role === 'CITIZEN' ? '/citizen/dashboard' : '/login',
      accentColor: 'border-l-4 border-l-blue-600',
      badgeText: t('common:roles.CITIZEN', 'Citizen'),
      actionText: t('auth:loginButton', 'Enter Citizen Portal'),
    },
    {
      role: t('operator:dashboardTitle', 'Department Operator Desk'),
      desc: t('operator:dashboardSubtitle', 'Process incoming departmental queues (FIFO oldest first), inspect citizen evidence, reject invalid complaints, or accept for field inspection.'),
      icon: Building2,
      link: user?.role === 'OPERATOR' ? '/operator/dashboard' : '/staff/login',
      accentColor: 'border-l-4 border-l-amber-500',
      badgeText: t('common:roles.OPERATOR', 'Operator'),
      actionText: t('operator:incomingQueueCount', 'Access Desk Queue'),
    },
    {
      role: t('engineer:dashboardTitle', 'Joint Engineer Field Console'),
      desc: t('engineer:dashboardSubtitle', 'Pick up complaints with atomic capacity controls, perform on-site verification, start repair work, and submit completion photographs.'),
      icon: Wrench,
      link: user?.role === 'ENGINEER' ? '/engineer/dashboard' : '/staff/login',
      accentColor: 'border-l-4 border-l-emerald-600',
      badgeText: t('common:roles.ENGINEER', 'Field Engineer'),
      actionText: t('engineer:queueTitle', 'Open Field Console'),
    },
    {
      role: t('admin:dashboardTitle', 'Municipal Admin Command Center'),
      desc: t('admin:dashboardSubtitle', 'Platform-wide governance, real-time analytics, staff provisioning with auto-generated IDs, department management, and immutable audit logs.'),
      icon: Shield,
      link: user?.role === 'ADMIN' ? '/admin/dashboard' : '/staff/login',
      accentColor: 'border-l-4 border-l-purple-600',
      badgeText: t('common:roles.ADMIN', 'Administrator'),
      actionText: t('admin:dashboardTitle', 'Launch Admin Console'),
    },
  ];

  const civicDepartments = [
    { name: t('common:deptRoads', 'Roads & Potholes'), icon: Layers, desc: 'Pavement restoration, potholes repair, asphalt overlay' },
    { name: t('common:deptWater', 'Water Supply'), icon: Droplets, desc: 'Pipeline leakage, potable water distribution, pressure drop' },
    { name: t('common:deptSanitation', 'Sanitation & Solid Waste'), icon: Truck, desc: 'Garbage clearance, community bin maintenance, segregation' },
    { name: t('common:deptLighting', 'Street Lighting'), icon: Lightbulb, desc: 'Defective street lamps, timer switches, pole maintenance' },
    { name: t('common:deptElectricity', 'Electricity & Utilities'), icon: Zap, desc: 'Cable hazard mitigation, transformer clearing, feeder issues' },
    { name: t('common:deptHealth', 'Public Health & Hygiene'), icon: HeartPulse, desc: 'Vector control, fogging, open drain disinfestation' },
  ];

  return (
    <div className="space-y-12 py-6">
      {/* 1. Official Government Hero Section */}
      <section className="bg-gradient-to-b from-white to-slate-100 border-b border-slate-200 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0f3b68]/10 border border-[#0f3b68]/20 text-[#0f3b68] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#0f3b68]" />
            <span>सत्यमेव जयते • {t('common:officialPortal', 'Official Municipal Citizen Grievance Portal')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0f3b68] tracking-tight max-w-4xl mx-auto leading-tight">
            {t('auth:homeHeroTitle', 'Transparent, Time-Bound Redressal of Municipal Grievances')}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('auth:homeHeroSubtitle', 'Directly connect with your local Municipal Corporation. Register grievances, track departmental ground verification, and inspect completed civic maintenance.')}
          </p>

          {/* Quick Track Grievance Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="bg-white p-4 sm:p-5 rounded-lg border-2 border-[#0f3b68] shadow-md text-left space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0f3b68]">
                {t('common:ticketNo', 'Ticket')} Status Tracker
              </label>

              <form onSubmit={handleTrackComplaint} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder={t('citizen:searchPlaceholder', 'Enter Ticket Number (e.g. CMP-2026-000001)...')}
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="civic-input pl-10 text-xs sm:text-sm font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="civic-btn-primary text-xs sm:text-sm whitespace-nowrap"
                >
                  {searching ? t('common:loading', 'Checking Records...') : t('common:search', 'Track Ticket')}
                </button>
              </form>

              {searchError && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{searchError}</span>
                    <div className="mt-1">
                      <Link to="/login" className="font-bold underline text-[#0f3b68]">
                        Click here to Login
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Official 4-Portal Gateways */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
            Integrated Governance Architecture
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Dedicated Portals for Citizens, Operators, Engineers &amp; Administrators
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
            All four operational branches coordinate on the same real-time municipal database records.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {portalCards.map((portal, idx) => {
            const Icon = portal.icon;
            return (
              <div
                key={idx}
                className={`civic-card p-5 flex flex-col justify-between hover:border-[#0f3b68] transition-all bg-white shadow-sm ${portal.accentColor}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-md bg-[#0f3b68] text-white flex items-center justify-center shadow">
                      <Icon className="w-5 h-5 text-amber-300" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {portal.badgeText}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {portal.role}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {portal.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    to={portal.link}
                    className="w-full civic-btn-secondary text-xs flex items-center justify-between group"
                  >
                    <span>{portal.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0f3b68] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Municipal Operational Divisions Scope */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="civic-card p-6 bg-slate-50/60 border border-slate-200">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Active Municipal Redressal Divisions
            </h3>
            <p className="text-xs text-slate-500">
              Citizen complaints are routed directly to designated departmental intake desks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {civicDepartments.map((dept, idx) => {
              const DeptIcon = dept.icon;
              return (
                <div key={idx} className="p-3.5 bg-white rounded-md border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 text-[#0f3b68] flex items-center justify-center shrink-0 border border-blue-100">
                    <DeptIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{dept.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{dept.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SLA & Citizen Charter Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="bg-[#0f3b68] text-white p-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-amber-400">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
              <Clock className="w-4 h-4" />
              <span>Standard Service Level Guarantee (SLA)</span>
            </div>
            <h3 className="text-lg font-bold">
              Guaranteed Initial Departmental Review within 48 Hours
            </h3>
            <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
              Every submitted grievance is assigned a permanent tracking ticket. Cases pending verification beyond 7 days are automatically escalated to the Municipal Commissioner oversight queue.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wide text-center transition-colors"
            >
              File New Grievance
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 text-center transition-colors"
            >
              Track Grievance
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
