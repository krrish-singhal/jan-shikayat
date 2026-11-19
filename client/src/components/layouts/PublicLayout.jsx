import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  LogIn,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.jsx';
import { ThemeToggle } from '../common/ThemeToggle.jsx';

/* ─── tiny text-size helper ─────────────────────────────────────────────── */
const TEXT_SIZES = ['14px', '16px', '18px'];
let currentSizeIdx = 1; // default = 16px

function applyTextSize(idx) {
  currentSizeIdx = Math.max(0, Math.min(TEXT_SIZES.length - 1, idx));
  document.documentElement.style.fontSize = TEXT_SIZES[currentSizeIdx];
}

/* ─── component ─────────────────────────────────────────────────────────── */
export const PublicLayout = () => {
  const { t } = useTranslation(['common', 'auth']);
  const { user, defaultDashboard } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen gov-page-bg flex flex-col justify-between font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 1 — OFFICIAL HEADER
      ═══════════════════════════════════════════════════════════════════ */}

      {/* 1-a  5 px tricolour strip */}
      <div className="gov-tricolor-strip w-full" aria-hidden="true" />

      {/* 1-b  Dark-navy utility bar */}
      <div className="bg-[#1F2F4D] text-white text-[11px] py-1.5 px-4 sm:px-6 border-b border-[#162440]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">

          {/* Skip-link (accessible, hidden until focused) */}
          <a href="#main-content" className="gov-skip-link gov-focus">
            Skip to main content
          </a>

          {/* Left: gov identity text */}
          <div className="flex items-center gap-2 font-medium tracking-wide min-w-0">
            <span className="font-semibold text-[#FF9933]">
              {t('common:bharatSarkar', 'भारत सरकार')}
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300 truncate">
              {t('common:appTitle', 'Municipal Grievance Redressal Board')}
            </span>
          </div>

          {/* Right: accessibility + controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto text-xs flex-wrap justify-end">
            {/* Text-size buttons — purely presentational */}
            <div className="flex items-center gap-0.5" aria-label="Text size controls" role="group">
              <button
                type="button"
                aria-label="Decrease text size"
                className="gov-text-size-btn text-[10px]"
                onClick={() => applyTextSize(currentSizeIdx - 1)}
              >
                A-
              </button>
              <button
                type="button"
                aria-label="Normal text size"
                className="gov-text-size-btn text-xs"
                onClick={() => applyTextSize(1)}
              >
                A
              </button>
              <button
                type="button"
                aria-label="Increase text size"
                className="gov-text-size-btn text-sm"
                onClick={() => applyTextSize(currentSizeIdx + 1)}
              >
                A+
              </button>
            </div>

            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>

            {/* Theme Toggle (keeps existing handler) */}
            <ThemeToggle variant="public" />

            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>

            {/* Language Selector (keeps existing handler) */}
            <LanguageSwitcher variant="public" />
          </div>
        </div>
      </div>

      {/* 1-c  White header row: logo + branding LEFT / helpline RIGHT */}
      <div className="bg-white dark:bg-slate-900 border-b border-[#CFD6E4] dark:border-slate-800 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo + JanShikayat badge */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="JanShikayat Home">
            <div
              className="w-12 h-12 rounded-full border-2 border-[#FF9933] overflow-hidden shrink-0 shadow-md"
              aria-hidden="true"
            >
              <img src="/logo.png" alt="JanShikayat Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-[#1F3A6E] dark:text-blue-400 tracking-tight text-xl leading-none">
                  {t('common:appName', 'JanShikayat')}
                </span>
                <span className="text-[12px] px-1.5 py-0.5 font-bold rounded bg-[#FF9933]/10 text-[#FF9933] border border-[#FF9933]/30 font-['Noto_Sans_Devanagari','Noto_Sans',sans-serif]">
                  जनशिकायत
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide mt-0.5 uppercase">
                {t('common:appTitle', 'Municipal Grievance Redressal Platform')}
              </span>
            </div>
          </Link>

          {/* RIGHT: helpline (from footer data — presentational reuse) */}
          <div className="hidden md:flex flex-col items-end gap-0.5 text-xs text-slate-600 dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#FF9933] shrink-0" aria-hidden="true" />
              <span>
                {t('common:tollFreeHelpline', 'Toll-Free Helpline')}:{' '}
                <strong className="text-[#1F3A6E] dark:text-white font-bold">1800-202-6000</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
              <span>grievance@municipal.gov.in</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1-d  Full-width navy nav bar */}
      <header className="bg-[#1F3A6E] dark:bg-[#1F2F4D] sticky top-0 z-40 shadow transition-colors duration-200" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Desktop nav row */}
          <div className="hidden lg:flex items-center justify-between h-11">
            <nav className="flex items-center h-full" aria-label="Main navigation">
              {/* HOME */}
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 h-full inline-flex items-center text-xs font-bold uppercase tracking-wider transition-colors border-b-[3px] ${isActive
                    ? 'text-[#FF9933] border-[#FF9933] gov-nav-active'
                    : 'text-white/80 border-transparent hover:text-white hover:border-white/30'
                  }`
                }
              >
                {t('common:home', 'Home')}
              </NavLink>

              {/* CITIZEN PORTAL */}
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-4 h-full inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-[3px] ${isActive
                    ? 'text-[#FF9933] border-[#FF9933]'
                    : 'text-white/80 border-transparent hover:text-white hover:border-white/30'
                  }`
                }
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                {t('auth:citizenNav', 'Citizen Portal')}
              </NavLink>

              {/* STAFF DESK */}
              <NavLink
                to="/staff/login"
                className={({ isActive }) =>
                  `px-4 h-full inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-[3px] ${isActive
                    ? 'text-[#FF9933] border-[#FF9933]'
                    : 'text-white/80 border-transparent hover:text-white hover:border-white/30'
                  }`
                }
              >
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t('auth:staffNav', 'Staff Desk')}
              </NavLink>

              {/* Go to workspace (logged-in) */}
              {user && (
                <Link
                  to={defaultDashboard}
                  className="px-4 h-full inline-flex items-center text-xs font-bold uppercase tracking-wider text-white/80 border-b-[3px] border-transparent hover:text-white hover:border-white/30 transition-colors"
                >
                  {t('auth:goToWorkspace', 'My Workspace')}
                </Link>
              )}
            </nav>

            {/* RIGHT: Register Grievance (keep existing style + route) */}
            <div className="flex items-center">
              <Link
                to="/signup"
                className="civic-btn-primary text-xs inline-flex items-center gap-1.5 !bg-[#2563EB] hover:!bg-[#1d4ed8] active:!bg-[#1e40af] !rounded-sm py-1.5 px-4"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common:registerComplaint', 'Register Grievance')}
              </Link>
            </div>
          </div>

          {/* Mobile nav row */}
          <div className="flex lg:hidden items-center justify-between h-11">
            <span className="text-white font-bold text-sm tracking-tight">JanShikayat</span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1F2F4D] dark:bg-[#111827] border-t border-white/10 px-4 py-3 space-y-1 shadow-xl">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              {t('common:home', 'Home')}
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              {t('auth:citizenNav', 'Citizen Portal')}
            </Link>
            <Link
              to="/staff/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              {t('auth:staffNav', 'Staff Desk')}
            </Link>
            {user && (
              <Link
                to={defaultDashboard}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2.5 rounded text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                {t('auth:goToWorkspace', 'My Workspace')} ({t(`common:roles.${user.role}`, user.role)})
              </Link>
            )}
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] text-center transition-colors"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              {t('common:registerComplaint', 'Register Grievance')}
            </Link>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between px-3">
              <span className="text-xs font-medium text-slate-300">{t('common:theme', 'Appearance')}</span>
              <ThemeToggle variant="default" />
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT (Outlet renders HomePage etc.)
      ═══════════════════════════════════════════════════════════════════ */}
      <main id="main-content" className="flex-1 w-full" role="main" tabIndex={-1}>
        <Outlet />
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          IDEA 5 — GOVERNMENT FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#1F2F4D] dark:bg-[#0f172a] text-slate-300 border-t-4 border-[#FF9933] text-xs" role="contentinfo">
        {/* 4-column footer grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-sm">
              <Shield className="w-5 h-5 text-[#FF9933]" aria-hidden="true" />
              <span>
                {t('common:appName', 'JanShikayat')} | <span className="font-['Noto_Sans_Devanagari','Noto_Sans',sans-serif]">जनशिकायत</span>
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {t('common:footerDesc', 'Official Grievance Redressal System designed for responsive municipal civic governance, departmental field inspection, and transparent citizen issue resolution.')}
            </p>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700">
              {t('common:footerCompliance', 'National Informatics Guidelines & Digital India Framework Aligned')}
            </div>
          </div>

          {/* Col 2: Integrated Portals */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-[#FF9933]/30">
              {t('common:integratedPortals', 'Integrated Portals')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('auth:citizenLoginTitle', 'Citizen Grievance Portal')}
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('operator:dashboardTitle', 'Department Operator Intake Desk')}
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('engineer:dashboardTitle', 'Joint Engineer Field Verification')}
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('admin:dashboardTitle', 'Municipal Admin Command Center')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Citizen Services */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-[#FF9933]/30">
              {t('common:citizenServices', 'Citizen Services')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/signup" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('common:registerComplaint', 'Register New Grievance')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('auth:trackGrievance', 'Track Ticket Status')}
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('auth:recoverPassword', 'Recover Citizen Password')}
                </Link>
              </li>
              <li>
                <a href="#helpline" className="hover:text-[#FF9933] transition-colors flex items-center gap-1.5">
                  <span className="text-[#FF9933]/60" aria-hidden="true">›</span>
                  {t('common:grievanceCharter', 'Citizen Grievance Charter')}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Civic Helpline */}
          <div id="helpline">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-[#FF9933]/30">
              {t('common:civicHelpline', 'Civic Helpline & Contact')}
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF9933] shrink-0" aria-hidden="true" />
                <span>
                  {t('common:tollFreeHelpline', 'Toll-Free')}:{' '}
                  <strong className="text-white">1800-202-6000</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF9933] shrink-0" aria-hidden="true" />
                <span>{t('common:controlRoom', 'Control Room')}: 020-25501000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FF9933] shrink-0" aria-hidden="true" />
                <span>grievance@municipal.gov.in</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                {t('common:desk247', '24×7 Civic Redressal & Emergency Coordination Desk.')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar: static policy links + meta */}
        <div className="bg-[#111c33] dark:bg-[#070c1a] border-t border-slate-800 py-3 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            {/* Static policy links */}
            <nav aria-label="Footer policy links" className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-start">
              {/* These are static / placeholder links as per IDEA 5 spec */}
              <a href="#" className="hover:text-[#FF9933] transition-colors whitespace-nowrap">Privacy Policy</a>
              <span aria-hidden="true" className="text-slate-700">|</span>
              <a href="#" className="hover:text-[#FF9933] transition-colors whitespace-nowrap">Terms of Use</a>
              <span aria-hidden="true" className="text-slate-700">|</span>
              <a href="#" className="hover:text-[#FF9933] transition-colors whitespace-nowrap">
                {t('common:copyright', '© {{year}} Municipal Corporation. Government of India.', { year: new Date().getFullYear() })}
              </a>
              <span aria-hidden="true" className="text-slate-700">|</span>
              <a href="#" className="hover:text-[#FF9933] transition-colors whitespace-nowrap">Hyperlinking Policy</a>
              <span aria-hidden="true" className="text-slate-700">|</span>
              <a href="#" className="hover:text-[#FF9933] transition-colors whitespace-nowrap">Sitemap</a>
              <span aria-hidden="true" className="text-slate-700">|</span>
              <a href="#" className="hover:text-[#FF9933] transition-colors whitespace-nowrap">Screen Reader Access</a>
            </nav>

            {/* Meta: last-updated + visitor count — static placeholders */}
            <div className="flex items-center gap-3 text-[11px] text-slate-500 whitespace-nowrap">
              {/* Dynamic last-updated: formatted as DD-Mon-YYYY */}
              <span>Last Updated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}</span>
              <span aria-hidden="true" className="text-slate-700">|</span>
              {/* TODO: replace with real visitor counter API call */}
              <span>Visitors: 1,24,587</span>
              <span aria-hidden="true" className="text-slate-700">|</span>
              <span>{t('common:contentManagedBy', 'NIC / Digital India')}</span>
            </div>
          </div>
        </div>

        {/* Bottom tricolour strip */}
        <div className="gov-tricolor-strip w-full" aria-hidden="true" />
      </footer>
    </div>
  );
};
