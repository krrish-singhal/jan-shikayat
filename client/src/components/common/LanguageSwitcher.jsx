import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../constants/languages.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export const LanguageSwitcher = ({ variant = 'default', className = '' }) => {
  const { i18n } = useTranslation();
  const { changeUserLanguage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLangCode = i18n.language ? i18n.language.split('-')[0] : DEFAULT_LANGUAGE;
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) ||
    SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE);

  const handleSelectLanguage = async (code) => {
    setIsOpen(false);
    if (changeUserLanguage) {
      await changeUserLanguage(code);
    } else {
      await i18n.changeLanguage(code);
      localStorage.setItem('i18nextLng', code);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPublic = variant === 'public';
  const isCompact = variant === 'compact';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 rounded-md transition-all font-medium text-xs ${
          isPublic
            ? 'px-2.5 py-1 bg-[#082543] text-amber-300 hover:text-white border border-blue-900/60 shadow-xs'
            : isCompact
            ? 'p-1.5 text-slate-600 hover:text-[#0f3b68] hover:bg-slate-100 border border-slate-200'
            : 'px-2.5 py-1.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs'
        }`}
      >
        <Languages className={`w-3.5 h-3.5 shrink-0 ${isPublic ? 'text-amber-400' : 'text-[#0f3b68]'}`} />
        <span className="font-semibold">{currentLang.nativeName}</span>
        {!isCompact && (
          <span className={`text-[10px] hidden sm:inline ${isPublic ? 'text-slate-300' : 'text-slate-500'}`}>
            ({currentLang.name})
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </button>

      {/* Language Selection Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 max-h-80 overflow-y-auto"
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Select Portal Language</span>
            <span className="font-mono text-slate-500">12 Indic Languages</span>
          </div>

          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLangCode;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 text-[#0f3b68] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  role="menuitem"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight text-slate-900">
                      {lang.nativeName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {lang.name} • <span className="text-slate-400">{lang.script}</span>
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#0f3b68] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
