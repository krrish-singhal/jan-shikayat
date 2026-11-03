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

export const PublicLayout = () => {
  const { t } = useTranslation(['common', 'auth']);
  const { user, defaultDashboard } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: A-, 1: A, 2: A+

  const handleFontSize = (level) => {
    setFontSizeLevel(level);
    const root = document.documentElement;
    if (level === 0) root.style.fontSize = '90%';
    else if (level === 1) root.style.fontSize = '100%';
    else if (level === 2) root.style.fontSize = '110%';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
      {/* 1. National Tricolor Top Strip */}
      <div className="gov-tricolor-strip w-full" />

      {/* 2. Official Government Header Top Bar */}
      <div className="bg-[#0b2f54] text-white text-[11px] py-1.5 px-4 sm:px-6 border-b border-[#082543]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span className="font-semibold text-amber-300">भारत सरकार</span>
            <span className="text-slate-300">|</span>
            <span>Government of India</span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-slate-200">Municipal Civic Grievance Redressal Board</span>
          </div>

          <div className="flex items-center gap-3 ml-auto text-xs">
            {/* Text Accessibility Controls */}
            <div className="flex items-center gap-1 bg-[#082543] px-2 py-0.5 rounded border border-blue-900/60">
              <span className="text-[10px] text-slate-300 mr-1 hidden sm:inline">Text Size:</span>
              <button
                onClick={() => handleFontSize(0)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  fontSizeLevel === 0 ? 'bg-amber-400 text-slate-900' : 'text-slate-200 hover:text-white'
                }`}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => handleFontSize(1)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  fontSizeLevel === 1 ? 'bg-amber-400 text-slate-900' : 'text-slate-200 hover:text-white'
                }`}
                title="Default font size"
              >
                A
              </button>
              <button
                onClick={() => handleFontSize(2)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  fontSizeLevel === 2 ? 'bg-amber-400 text-slate-900' : 'text-slate-200 hover:text-white'
                }`}
                title="Increase font size"
              >
                A+
              </button>
            </div>

            <span className="text-slate-400 hidden sm:inline">|</span>

            {/* Global Language Selector Component */}
            <LanguageSwitcher variant="public" />
          </div>
        </div>
      </div>

      {/* 3. Official Municipal Portal Navigation Bar */}
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Official Emblem & Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* National Crest / Civic Emblem Emblem Badge */}
            <div className="w-12 h-12 rounded-full bg-[#0f3b68] border-2 border-amber-400 flex items-center justify-center text-white font-serif font-black shadow-md shrink-0">
              <Shield className="w-6 h-6 text-amber-300" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#0f3b68] tracking-tight text-xl leading-none font-serif">
                  {t('common:appName', 'जन शिकायत')}
                </span>
                <span className="text-xs px-1.5 py-0.5 font-bold uppercase rounded bg-amber-100 text-amber-800 border border-amber-200">
                  JanShikayat
                </span>
              </div>
              <span className="text-[11px] text-slate-600 font-semibold tracking-wide mt-0.5 uppercase">
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
                  isActive ? 'text-[#0f3b68] bg-blue-50 border border-blue-200' : 'text-slate-700 hover:text-[#0f3b68] hover:bg-slate-100'
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
                {t('auth:goToWorkspace', 'Go to Workspace')} ({user.role})
              </Link>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                      isActive ? 'text-[#0f3b68] bg-blue-50 border border-blue-200' : 'text-slate-700 hover:text-[#0f3b68] hover:bg-slate-100'
                    }`
                  }
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('auth:citizenLoginTitle', 'Citizen Login')}</span>
                </NavLink>

                <NavLink
                  to="/staff/login"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 ${
                      isActive ? 'text-[#0f3b68] bg-blue-50 border border-blue-200' : 'text-slate-700 hover:text-[#0f3b68] hover:bg-slate-100'
                    }`
                  }
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t('auth:staffLoginTitle', 'Staff Desk Login')}</span>
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
            className="p-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {t('common:home', 'Home')}
            </Link>

            {user ? (
              <Link
                to={defaultDashboard}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded text-sm font-semibold text-white bg-[#0f3b68] text-center"
              >
                {t('auth:goToWorkspace', 'Go to Workspace')} ({user.role})
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <LogIn className="w-4 h-4 text-[#0f3b68]" />
                  <span>{t('auth:citizenLoginTitle', 'Citizen Login')}</span>
                </Link>

                <Link
                  to="/staff/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <Building2 className="w-4 h-4 text-[#0f3b68]" />
                  <span>{t('auth:staffLoginTitle', 'Staff Desk Login')}</span>
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded text-sm font-semibold text-white bg-[#0f3b68] text-center"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('common:registerComplaint', 'Register Grievance')}</span>
                </Link>
              </>
            )}
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
              <span>जन शिकायत | JanShikayat</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Official Grievance Redressal System designed for responsive municipal civic governance, departmental field inspection, and transparent citizen issue resolution.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700">
              National Informatics Guidelines &amp; Digital India Framework Aligned
            </div>
          </div>

          {/* Col 2: Portals */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-blue-900">
              Integrated Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Citizen Grievance Portal
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Department Operator Intake Desk
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Joint Engineer Field Verification
                </Link>
              </li>
              <li>
                <Link to="/staff/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Municipal Admin Command Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Citizen Services */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-blue-900">
              Citizen Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/signup" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Register New Grievance
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Track Ticket Status
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Recover Citizen Password
                </Link>
              </li>
              <li>
                <a href="#helpline" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-500">•</span> Citizen Grievance Charter
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Official Helpline */}
          <div id="helpline">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 pb-1 border-b border-blue-900">
              Civic Helpline &amp; Contact
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Toll-Free Helpline: <strong className="text-white">1800-202-6000</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Control Room: 020-25501000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>grievance@municipal.gov.in</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                24x7 Civic Redressal &amp; Emergency Coordination Desk.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Copyright & Compliance */}
        <div className="bg-[#082543] py-4 px-4 sm:px-6 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} Municipal Corporation. Government of India. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Website Content Managed by Municipal Civic Corporation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
