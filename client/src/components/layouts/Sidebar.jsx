import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api.js';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  User,
  LogOut,
  Inbox,
  History,
  CheckSquare,
  Briefcase,
  Users,
  Building2,
  ShieldAlert,
  BellRing,
  ClipboardList,
  Shield,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';

export const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['common', 'operator', 'engineer', 'admin']);
  const { user, logout } = useAuth();
  const [pendingNoticeRequests, setPendingNoticeRequests] = useState(0);

  useEffect(() => {
    if (user?.role === ROLES.ADMIN) {
      api
        .get('/notice-requests/admin/count')
        .then((res) => {
          setPendingNoticeRequests(res.data?.data?.count || 0);
        })
        .catch(() => { });
    }
  }, [user?.role]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!user) return null;

  let links = [];

  if (user.role === ROLES.CITIZEN) {
    links = [
      { to: '/citizen/dashboard', label: t('common:dashboard', 'Citizen Dashboard'), icon: LayoutDashboard },
      { to: '/citizen/complaints/new', label: t('common:registerComplaint', 'Register Grievance'), icon: PlusCircle },
      { to: '/citizen/complaints', label: t('common:myComplaints', 'My Grievances'), icon: FileText },
      { to: '/citizen/profile', label: t('common:profile', 'My Profile'), icon: User },
    ];
  } else if (user.role === ROLES.OPERATOR) {
    links = [
      { to: '/operator/dashboard', label: t('operator:dashboardTitle', 'Intake Dashboard'), icon: LayoutDashboard },
      { to: '/operator/complaints', label: t('operator:incomingQueueTitle', 'Incoming Queue (FIFO)'), icon: Inbox },
      { to: '/operator/history', label: t('operator:historyTitle', 'Handled History'), icon: History },
      { to: '/operator/profile', label: t('operator:profileTitle', 'Staff Profile'), icon: User },
    ];
  } else if (user.role === ROLES.ENGINEER) {
    links = [
      { to: '/engineer/dashboard', label: t('engineer:dashboardTitle', 'Engineer Dashboard'), icon: LayoutDashboard },
      { to: '/engineer/queue', label: t('engineer:queueTitle', 'Verification Queue'), icon: CheckSquare },
      { to: '/engineer/my-cases', label: t('engineer:myCasesTitle', 'Active Field Cases'), icon: Briefcase },
      { to: '/engineer/profile', label: t('engineer:profileTitle', 'Engineer Profile'), icon: User },
    ];
  } else if (user.role === ROLES.ADMIN) {
    links = [
      { to: '/admin/dashboard', label: t('admin:dashboardTitle', 'Analytics Console'), icon: LayoutDashboard },
      { to: '/admin/staff', label: t('admin:staffGovernance', 'Staff Governance'), icon: Users },
      { to: '/admin/departments', label: t('admin:departmentsTitle', 'Departments'), icon: Building2 },
      { to: '/admin/notices', label: 'Notice Board', icon: BellRing, badge: pendingNoticeRequests },
      { to: '/admin/complaints', label: t('admin:allCasesTitle', 'All Municipal Cases'), icon: ClipboardList },
      { to: '/admin/citizens', label: t('admin:citizenRegistryTitle', 'Citizen Registry'), icon: User },
      { to: '/admin/audit', label: t('admin:auditLogsTitle', 'Security Audit Trail'), icon: ShieldAlert },
      { to: '/admin/profile', label: t('admin:profileTitle', 'Admin Profile'), icon: User },
    ];
  }

  return (
    <>
      {/* Backdrop Overlay (closes when clicked outside) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Official Government Aside Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#0a2540] text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#082038] ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Brand & Close Sign */}
          <div className="h-16 flex items-center justify-between px-3.5 bg-[#061c33] border-b border-[#082543]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-serif font-black shadow shrink-0">
                <Shield className="w-4 h-4 text-slate-950" />
              </div>
              <div className="truncate">
                <span className="font-bold text-sm tracking-wide text-white leading-tight font-serif block truncate">
                  जन शिकायत
                </span>
                <span className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase block truncate">
                  JanShikayat Portal
                </span>
              </div>
            </div>

            {/* Prominent Close Sidebar Button / Sign with smooth hover & closing animation */}
            <button
              onClick={onClose}
              className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white bg-[#0f3459]/70 hover:bg-[#0f3b68] border border-[#14426f] flex items-center gap-1 transition-all duration-200 active:scale-95 shadow-sm group shrink-0"
              aria-label={t('common:closeSidebar', 'Close Sidebar')}
              title={t('common:closeSidebar', 'Close Sidebar')}
            >
              <ChevronLeft className="w-4 h-4 text-amber-300 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white">
                {t('common:close', 'Close')}
              </span>
            </button>
          </div>

          {/* User Government Official Identity Card */}
          <div className="p-3.5 mx-3 my-3 bg-[#0f3459] rounded-lg border border-[#14426f]">
            <div className="text-[11px] text-slate-300 font-medium">{t('common:loggedInUser', 'Logged in User')}</div>
            <div className="text-sm font-bold text-white truncate font-sans">{user.name}</div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wide">
                {t(`common:roles.${user.role}`, ROLE_LABELS[user.role] || user.role)}
              </span>
              {user.staffId && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0a2540] text-slate-200 border border-slate-700">
                  {user.staffId}
                </span>
              )}
            </div>
            {user.departmentId?.name && (
              <div className="mt-2 pt-2 border-t border-[#14426f] text-[11px] text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate">{t(`common:departments.${user.departmentId.name}`, user.departmentId.name)}</span>
              </div>
            )}
          </div>

          {/* Navigation Links with Inter Font & Official States */}
          <nav className="px-3 py-1 space-y-1 flex-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all ${isActive
                      ? 'bg-[#0f3b68] text-amber-300 border-l-4 border-amber-400 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-[#0f3459]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  {link.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shrink-0">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer with Sign Out */}
          <div className="p-3 border-t border-[#082038] bg-[#061c33]">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('common:signOutAuthority', 'Sign Out')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
