import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { Modal } from './Modal.jsx';

export const GooglePhoneModal = ({
  isOpen,
  onClose,
  googleProfile,
  onSubmit,
  onSkip,
  loading = false,
}) => {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const [phone, setPhone] = useState(googleProfile?.phone || '');
  const [error, setError] = useState('');

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ''); // keep numbers only
    if (raw.length <= 10) {
      setPhone(raw);
      if (error) setError('');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!phone) {
      setError(t('validation:phoneRequired', 'Please enter a 10-digit phone number or click "Skip for now"'));
      return;
    }
    if (phone.length !== 10) {
      setError(t('validation:phoneInvalid', 'Mobile number must be exactly 10 digits'));
      return;
    }
    onSubmit(phone);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title={t('auth:completeProfileTitle', 'Complete Citizen Profile')}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Profile Card Header */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
            {googleProfile?.name ? googleProfile.name.charAt(0).toUpperCase() : 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
              <span>{googleProfile?.name || t('common:citizen', 'Google Citizen')}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                <UserCheck className="w-3 h-3" />
                {t('common:verified', 'Verified')}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {googleProfile?.email}
            </p>
          </div>
        </div>

        {/* Civic Explanatory note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            {t('auth:phoneLabel', 'Mobile Number for SMS & Grievance Updates')}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('auth:phoneHelpText', 'Municipal engineers and field staff send real-time SMS updates regarding your complaints. Adding your number makes tracking much easier.')}
          </p>
        </div>

        {/* Phone Input with +91 indicator */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <div className="relative flex rounded-lg shadow-xs">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                +91
              </span>
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="98765 43210"
                  maxLength={10}
                  autoFocus
                  disabled={loading}
                  className="civic-input rounded-l-none pl-3 text-sm font-medium tracking-wide"
                />
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('auth:phonePrivacyNote', 'Used strictly for official municipal notifications and grievance status alerts.')}</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              disabled={loading}
              className="civic-btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <Phone className="w-4 h-4" />
              <span>{loading ? t('common:loading', 'Saving...') : t('common:saveAndContinue', 'Save & Continue')}</span>
            </button>

            <button
              type="button"
              onClick={onSkip}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{t('common:skipForNow', 'Skip for now')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
