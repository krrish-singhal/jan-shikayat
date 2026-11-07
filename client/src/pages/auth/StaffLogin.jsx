import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Building2, Wrench, Lock, Eye, EyeOff, BadgeCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { ROLE_DASHBOARD_ROUTES } from '../../constants/roles.js';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher.jsx';

const staffLoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Staff ID or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const StaffLogin = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { loginStaff } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffLoginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { user } = await loginStaff(data);
      addToast(`Logged in successfully as ${user.name} (${user.role})`, 'success');
      const targetRoute = ROLE_DASHBOARD_ROUTES[user.role] || '/';
      navigate(targetRoute);
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (staffId, pass) => {
    setValue('identifier', staffId);
    setValue('password', pass);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="civic-card p-8 max-w-lg w-full shadow-lg border border-slate-200">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher variant="default" />
        </div>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Shield className="w-6 h-6 text-brand-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('staffLoginTitle', 'Municipal Staff Login')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('staffLoginSubtitle', 'Department Operators, Joint Engineers & Municipal Administrators')}
          </p>
        </div>

        {/* Demo Quick-Fill Buttons */}
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Quick-Fill Seed Credentials:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('ADM-0001', 'Admin@SecurePass2026!')}
              className="px-2 py-1.5 text-left bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] transition-colors"
            >
              <div className="font-bold text-purple-700">{t('common:roles.ADMIN', 'Admin')}</div>
              <div className="text-slate-500 font-mono text-[10px]">ADM-0001</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('OP-0001', 'Staff@SecurePass2026!')}
              className="px-2 py-1.5 text-left bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] transition-colors"
            >
              <div className="font-bold text-blue-700">{t('common:roles.OPERATOR', 'Operator')}</div>
              <div className="text-slate-500 font-mono text-[10px]">OP-0001</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('ENG-0001', 'Staff@SecurePass2026!')}
              className="px-2 py-1.5 text-left bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] transition-colors"
            >
              <div className="font-bold text-emerald-700">{t('common:roles.ENGINEER', 'Engineer')}</div>
              <div className="text-slate-500 font-mono text-[10px]">ENG-0001</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('staffId', 'Staff ID or Official Email')}
            </label>
            <div className="relative">
              <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                {...register('identifier')}
                placeholder="OP-0001 or admin@civic.gov.in"
                className="civic-input pl-10 uppercase"
              />
            </div>
            {errors.identifier && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('password', 'Staff Password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••"
                className="civic-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="civic-btn-primary w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800"
          >
            {loading ? t('common:loading', 'Validating Credentials...') : t('staffLoginButton', 'Sign In to Staff Console')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Citizen user?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            {t('citizenLoginTitle', 'Go to Citizen Login')}
          </Link>
        </div>
      </div>
    </div>
  );
};
