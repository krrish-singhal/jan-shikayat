import React from 'react';
import { NavLink } from 'react-router-dom';
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
  ClipboardList,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  let links = [];

  if (user.role === ROLES.CITIZEN) {
    links = [
      { to: '/citizen/dashboard', label: 'Citizen Dashboard', icon: LayoutDashboard },
      { to: '/citizen/complaints/new', label: 'Register Grievance', icon: PlusCircle },
      { to: '/citizen/complaints', label: 'My Grievances', icon: FileText },
      { to: '/citizen/profile', label: 'My Profile', icon: User },
    ];
  } else if (user.role === ROLES.OPERATOR) {
    links = [
      { to: '/operator/dashboard', label: 'Intake Dashboard', icon: LayoutDashboard },
      { to: '/operator/complaints', label: 'Incoming Queue (FIFO)', icon: Inbox },
      { to: '/operator/history', label: 'Handled History', icon: History },
      { to: '/operator/profile', label: 'Staff Profile', icon: User },
    ];
  } else if (user.role === ROLES.ENGINEER) {
    links = [
      { to: '/engineer/dashboard', label: 'Engineer Dashboard', icon: LayoutDashboard },
      { to: '/engineer/queue', label: 'Verification Queue', icon: CheckSquare },
      { to: '/engineer/my-cases', label: 'Active Field Cases', icon: Briefcase },
      { to: '/engineer/profile', label: 'Engineer Profile', icon: User },
    ];
  } else if (user.role === ROLES.ADMIN) {
    links = [
      { to: '/admin/dashboard', label: 'Analytics Console', icon: LayoutDashboard },
      { to: '/admin/staff', label: 'Staff Governance', icon: Users },
      { to: '/admin/departments', label: 'Departments', icon: Building2 },
      { to: '/admin/complaints', label: 'All Municipal Cases', icon: ClipboardList },
      { to: '/admin/citizens', label: 'Citizen Registry', icon: User },
      { to: '/admin/audit', label: 'Security Audit Trail', icon: ShieldAlert },
      { to: '/admin/profile', label: 'Admin Profile', icon: User },
    ];
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Official Government Aside Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#0a2540] text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#082038] lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header Brand */}
          <div className="h-16 flex items-center justify-between px-5 bg-[#061c33] border-b border-[#082543]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-serif font-black shadow">
                <Shield className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wide text-white leading-tight font-serif block">
                  जन शिकायत
                </span>
                <span className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase block">
                  JanShikayat Portal
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Government Official Identity Card */}
          <div className="p-3.5 mx-3 my-3 bg-[#0f3459] rounded-lg border border-[#14426f]">
            <div className="text-[11px] text-slate-300 font-medium">Logged in Authority</div>
            <div className="text-sm font-bold text-white truncate font-sans">{user.name}</div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wide">
                {ROLE_LABELS[user.role] || user.role}
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
                <span className="truncate">{user.departmentId.name}</span>
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
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#0f3b68] text-amber-300 border-l-4 border-amber-400 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-[#0f3459]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
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
              <span>Sign Out Authority</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
