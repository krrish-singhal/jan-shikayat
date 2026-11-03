import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher.jsx';
import api from '../../services/api.js';
import { useToast } from '../../contexts/ToastContext.jsx';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const ResetPassword = () => {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError(t('validation:tokenMissing', 'Reset token is missing from URL.'));
      return;
    }

    if (!passwordPattern.test(newPassword)) {
      setError(t('validation:passwordComplexity', 'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('validation:passwordMatch', 'Passwords do not match.'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/auth/reset-password', { token, newPassword });
      addToast(t('auth:passwordResetSuccess', 'Password has been reset successfully. Please log in with your new password.'), 'success');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="civic-card p-8 max-w-md w-full shadow-lg border border-slate-200">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher variant="default" />
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 border border-brand-100">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('resetPasswordTitle', 'Set New Password')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('resetPasswordSubtitle', 'Enter your new secure password below')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('newPassword', 'New Password')}
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="civic-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('confirmPassword', 'Confirm Password')}
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="civic-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="civic-btn-primary w-full py-2.5 mt-2"
          >
            {loading ? t('common:loading', 'Updating Password...') : t('updatePassword', 'Reset Password')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            {t('backToLogin', 'Back to Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
};
