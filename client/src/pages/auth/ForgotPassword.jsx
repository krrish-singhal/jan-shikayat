import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher.jsx';
import api from '../../services/api.js';

export const ForgotPassword = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.data?.data?.devToken) {
        setDevToken(res.data.data.devToken);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="civic-card p-8 max-w-md w-full shadow-lg border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {t('backToLogin', 'Back to Sign In')}
          </Link>
          <LanguageSwitcher variant="default" />
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('forgotPasswordTitle', 'Forgot Password')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('forgotPasswordSubtitle', 'Enter your registered email to receive recovery instructions')}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">{t('sendResetLink', 'Password reset instructions dispatched')}</p>
                <p>If an account exists for <span className="font-bold">{email}</span>, an email has been sent with recovery instructions.</p>
              </div>
            </div>

            {devToken && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs space-y-2">
                <span className="font-mono font-bold text-slate-700 block">Development Quick Link:</span>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="civic-btn-primary text-xs py-1.5 w-full text-center inline-block"
                >
                  {t('resetPasswordTitle', 'Proceed to Reset Password')}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('email', 'Email Address')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="civic-input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="civic-btn-primary w-full py-2.5 mt-2"
            >
              {loading ? t('common:loading', 'Sending Link...') : t('sendResetLink', 'Send Reset Link')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
