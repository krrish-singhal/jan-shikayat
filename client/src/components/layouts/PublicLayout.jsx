import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  LogIn,
  UserPlus,
  Building2,
  Search,
  Phone,
  Mail,
  HelpCircle,
  ExternalLink,
  Menu,
  X,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.jsx';
import { ThemeToggle } from '../common/ThemeToggle.jsx';

export const PublicLayout = () => {
  const { t } = useTranslation(['common', 'auth']);
  const { user, defaultDashboard } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* 1. National Tricolor Top Strip */}
      <div className="gov-tricolor-strip w-full" />

      {/* 2. Official Government Header Top Bar */}
      <div className="bg-[#0b2f54] text-white text-[11px] py-1.5 px-4 sm:px-6 border-b border-[#082543]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span className="font-semibold text-amber-300">{t('common:bharatSarkar', 'भारत सरकार')}</span>
            <span className="text-slate-300">|</span>
            <span>{t('common:govIndia', 'Government of India')}</span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-slate-200">{t('common:appTitle', 'Municipal Civic Grievance Redressal Board')}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto text-xs">
            {/* Theme Toggle (Public header variant) */}
            <ThemeToggle variant="public" />

            <span className="text-slate-400 hidden sm:inline">|</span>

            {/* Global Language Selector Component */}
            <LanguageSwitcher variant="public" />
          </div>
        </div>
      </div>

      {/* 3. Official Municipal Portal Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Official Emblem & Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* National Crest / Civic Emblem Emblem Badge */}
            <div className="w-12 h-12 rounded-full bg-[#0f3b68] border-2 border-amber-400 flex items-center justify-center text-white font-serif font-black shadow-md shrink-0">
              <Shield className="w-6 h-6 text-amber-300" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#0f3b68] dark:text-blue-400 tracking-tight text-xl leading-none font-serif">
                  {t('common:appName', 'जन शिकायत')}
                </span>
                <span className="text-xs px-1.5 py-0.5 font-bold uppercase rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                  JanShikayat
                </span>
              </div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold tracking-wide mt-0.5 uppercase">
                {t('common:appTitle', 'Municipal Grievance Redressal Platform')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'text-[#0f3b68] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900'
                    : 'text-slate-700 dark:text-slate-300 hover:text-[#0f3b68] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {t('common:home', 'Home')}
            </NavLink>

            {user ? (
              <Link
                to={defaultDashboard}
                className="civic-btn-primary ml-2 text-xs"
              >
                {t('auth:goToWorkspace', 'Go to Workspace')} ({t(`common:roles.${user.role}`, user.role)})
              </Link>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'text-[#0f3b68] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900'
                        : 'text-slate-700 dark:text-slate-300 hover:text-[#0f3b68] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('auth:citizenNav', 'Citizen Portal')}</span>
                </NavLink>

                <NavLink
                  to="/staff/login"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                      isActive
                        ? 'text-[#0f3b68] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900'
                        : 'text-slate-700 dark:text-slate-300 hover:text-[#0f3b68] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t('auth:staffNav', 'Staff Desk')}</span>
                </NavLink>

                <Link
                  to="/signup"
                  className="civic-btn-primary ml-2 text-xs inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t('common:registerComplaint', 'Register Grievance')}</span>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('common:home', 'Home')}
            </Link>

            {user ? (
              <Link
                to={defaultDashboard}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded text-sm font-semibold text-white bg-[#0f3b68] dark:bg-blue-600 text-center"
              >
                {t('auth:goToWorkspace', 'Go to Workspace')} ({t(`common:roles.${user.role}`, user.role)})
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogIn className="w-4 h-4 text-[#0f3b68] dark:text-blue-400" />
                  <span>{t('auth:citizenNav', 'Citizen Portal')}</span>
                </Link>

                <Link
                  to="/staff/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Building2 className="w-4 h-4 text-[#0f3b68] dark:text-blue-400" />
                  <span>{t('auth:staffNav', 'Staff Desk')}</span>
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded text-sm font-semibold text-white bg-[#0f3b68] dark:bg-blue-600 text-center"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('common:registerComplaint', 'Register Grievance')}</span>
                </Link>
              </>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('common:theme', 'Appearance Theme')}</span>
              <ThemeToggle variant="default" />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* 4. Official Municipal Government Footer */}
      <footer className="bg-[#0b2f54] text-slate-300 border-t-4 border-[#ff9933] text-xs">
        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Government Authority info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>{t('common:appName', 'जन शिकायत')} | JanShikayat</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {t('common:footerDesc', 'Official Grievance Redressal System designed for responsive municipal civic governance, departmental field inspection, and transparent citizen issue resolution.')}
            </p>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700">
              {t('common:footerCompliance', 'National Informatics Guidelines & Digital India Framework Aligned')}
            </div>
          </div>

          {/* Col 2: Portals */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-blue-900">
              {t('common:integratedPortals', 'Integrated Portals')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('auth:citizenLoginTitle', 'Citizen Grievance Portal')}
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('operator:dashboardTitle', 'Department Operator Intake Desk')}
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('engineer:dashboardTitle', 'Joint Engineer Field Verification')}
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('admin:dashboardTitle', 'Municipal Admin Command Center')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Citizen Services */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-blue-900">
              {t('common:citizenServices', 'Citizen Services')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/signup" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('common:registerComplaint', 'Register New Grievance')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('auth:trackGrievance', 'Track Ticket Status')}
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('auth:recoverPassword', 'Recover Citizen Password')}
                </Link>
              </li>
              <li>
                <a href="#helpline" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> {t('common:grievanceCharter', 'Citizen Grievance Charter')}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Helpline */}
          <div id="helpline">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-blue-900">
              {t('common:civicHelpline', 'Civic Helpline & Contact')}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {t('common:tollFreeHelpline', 'Toll-Free Helpline')}: <strong className="text-white">1800-202-6000</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t('common:controlRoom', 'Control Room')}: 020-25501000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>grievance@municipal.gov.in</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {t('common:desk247', '24x7 Civic Redressal & Emergency Coordination Desk.')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright & Compliance */}
        <div className="bg-[#082543] py-4 px-4 sm:px-6 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
            <div>
              {t('common:copyright', '© {{year}} Municipal Corporation. Government of India. All rights reserved.', { year: new Date().getFullYear() })}
            </div>
            <div className="flex items-center gap-4">
              <span>{t('common:contentManagedBy', 'Website Content Managed by Municipal Civic Corporation')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
