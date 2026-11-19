import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { GooglePhoneModal } from '../../components/common/GooglePhoneModal.jsx';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const CitizenLogin = () => {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const { loginCitizen, loginWithGoogle, checkGoogleUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const handleFillDemo = (email, pass) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await loginCitizen(data);
      addToast(t('auth:welcomeBackCitizen', 'Welcome back to JanShikayat Citizen Portal'), 'success');
      navigate('/citizen/dashboard');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset googleLoading if page is restored from bfcache or mounted fresh
  useEffect(() => {
    const handlePageShow = () => setGoogleLoading(false);
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleGoogleSuccessProfile = async (profile) => {
    try {
      setGoogleLoading(true);
      // Check if user exists and whether phone is already provided
      const status = await checkGoogleUser({
        email: profile.email,
        googleId: profile.googleId,
      });

      if (status?.exists && status?.hasPhone) {
        // User exists and already has phone -> login directly
        await loginWithGoogle({
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
        });
        addToast(`Welcome back, ${status.name || profile.name}!`, 'success');
        navigate('/citizen/dashboard');
      } else {
        // First-time signup or missing phone -> prompt citizen for phone number
        setPendingGoogleUser({
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          phone: '',
        });
        setPhoneModalOpen(true);
      }
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePhoneSubmit = async (phone) => {
    if (!pendingGoogleUser) return;
    try {
      setPhoneSubmitting(true);
      await loginWithGoogle({
        ...pendingGoogleUser,
        phone,
      });
      setPhoneModalOpen(false);
      addToast(t('auth:mobileLinked', 'Welcome to JanShikayat! Mobile number linked.'), 'success');
      navigate('/citizen/dashboard');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setPhoneSubmitting(false);
    }
  };

  const handlePhoneSkip = async () => {
    if (!pendingGoogleUser) return;
    try {
      setPhoneSubmitting(true);
      await loginWithGoogle(pendingGoogleUser);
      setPhoneModalOpen(false);
      addToast(t('auth:welcomeCitizenPortal', 'Welcome to JanShikayat Citizen Portal!'), 'success');
      navigate('/citizen/dashboard');
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message, 'error');
    } finally {
      setPhoneSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 1. Try Google Identity Services (GIS) Token Client if script is loaded
    if (googleClientId && window.google?.accounts?.oauth2) {
      try {
        setGoogleLoading(true);

        let resolved = false;
        let safetyTimer = null;
        let focusTimer = null;

        const cleanup = () => {
          resolved = true;
          if (safetyTimer) clearTimeout(safetyTimer);
          if (focusTimer) clearTimeout(focusTimer);
          window.removeEventListener('focus', onFocus);
        };

        const onFocus = () => {
          // If user closes popup or switches tabs and returns without completing auth
          focusTimer = setTimeout(() => {
            if (!resolved) {
              setGoogleLoading(false);
            }
          }, 1500);
        };

        window.addEventListener('focus', onFocus);

        // Safety fallback: auto-reset loading after 40 seconds of inactivity
        safetyTimer = setTimeout(() => {
          if (!resolved) {
            setGoogleLoading(false);
          }
        }, 40000);

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            cleanup();
            if (tokenResponse.error) {
              setGoogleLoading(false);
              if (tokenResponse.error === 'popup_closed_by_user') {
                return;
              }
              // If popup or origins blocked, seamlessly use server OAuth redirect
              console.warn('[GIS popup error, redirecting to server OAuth]', tokenResponse.error);
              window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/google`;
              return;
            }
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await userInfoRes.json();
              await handleGoogleSuccessProfile({
                email: profile.email,
                name: profile.name,
                googleId: profile.sub,
                accessToken: tokenResponse.access_token,
              });
            } catch (err) {
              setGoogleLoading(false);
              addToast(err.response?.data?.error?.message || err.message, 'error');
            }
          },
          error_callback: (nonOAuthErr) => {
            cleanup();
            setGoogleLoading(false);
            console.warn('[GIS error_callback]', nonOAuthErr);
            if (nonOAuthErr?.type === 'popup_failed_to_open') {
              window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/google`;
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        setGoogleLoading(false);
        console.warn('[GIS init failed, redirecting to server OAuth]', err);
      }
    }

    // 2. Official Google OAuth 2.0 Web Redirect Flow (always forces prompt=select_account)
    setGoogleLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="civic-card p-8 max-w-md w-full shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 border border-brand-100 dark:border-brand-900/50">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('citizenLoginTitle', 'Citizen Sign In')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('citizenLoginSubtitle', 'Access your registered complaints and track status')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('email', 'Email Address')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                {...register('email')}
                placeholder="aarav.patel@gmail.com"
                className="civic-input pl-10"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('password', 'Password')}
              </label>
              <Link to="/forgot-password" className="text-xs text-brand-600 dark:text-blue-400 hover:underline">
                {t('forgotPassword', 'Forgot password?')}
              </Link>
            </div>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 rounded-md transition-colors"
                aria-label={showPassword ? t('hidePassword', 'Hide password') : t('showPassword', 'Show password')}
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
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="civic-btn-primary w-full py-2.5 mt-2"
          >
            {loading ? t('common:processing', 'Authenticating...') : t('loginButton', 'Sign In as Citizen')}
          </button>
        </form>

        {/* Google OAuth Option */}
        <div className="my-5 relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute">
            {t('common:or', 'or')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? t('common:loading', 'Connecting...') : t('googleLogin', 'Sign in with Google')}</span>
        </button>

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <div>
            {t('dontHaveAccount', "Don't have an account?")}{' '}
            <Link to="/signup" className="text-brand-600 dark:text-blue-400 font-semibold hover:underline">
              {t('registerNow', 'Register now')}
            </Link>
          </div>
          <div className="pt-2">
            {t('areYouStaff', 'Are you a municipal staff member?')}{' '}
            <Link to="/staff/login" className="text-slate-700 dark:text-slate-300 font-semibold hover:underline inline-flex items-center gap-1">
              {t('staffLoginButton', 'Staff Portal Login')} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <GooglePhoneModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        googleProfile={pendingGoogleUser}
        onSubmit={handlePhoneSubmit}
        onSkip={handlePhoneSkip}
        loading={phoneSubmitting}
      />
    </div>
  );
};
