import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { GooglePhoneModal } from '../../components/common/GooglePhoneModal.jsx';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Please enter a valid email address'),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordPattern,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (@$!%*?&)'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const CitizenSignup = () => {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const { registerCitizen, loginWithGoogle, checkGoogleUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await registerCitizen({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      addToast('Account created successfully! Welcome to JanShikayat.', 'success');
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

      const typedPhone = getValues('phone')?.trim() || '';

      if (status?.exists && status?.hasPhone) {
        // User exists and already has phone -> login directly
        await loginWithGoogle({
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
        });
        addToast(`Welcome back, ${status.name || profile.name}!`, 'success');
        navigate('/citizen/dashboard');
      } else if (typedPhone && typedPhone.replace(/\D/g, '').length === 10) {
        // User already typed their 10-digit phone on the form -> use it directly!
        await loginWithGoogle({
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          phone: typedPhone.replace(/\D/g, ''),
        });
        addToast('Account created and mobile number linked successfully!', 'success');
        navigate('/citizen/dashboard');
      } else {
        // First-time signup or missing phone -> prompt citizen for phone number
        setPendingGoogleUser({
          email: profile.email,
          name: profile.name,
          googleId: profile.googleId,
          phone: typedPhone.replace(/\D/g, '') || '',
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
      addToast('Account created and mobile number linked successfully!', 'success');
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
      addToast('Welcome to JanShikayat Citizen Portal!', 'success');
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
      <div className="civic-card p-8 max-w-lg w-full shadow-lg border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 border border-brand-100 dark:border-brand-900/50">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {t('signupTitle', 'Citizen Registration')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('signupSubtitle', 'Create an account to submit and monitor municipal complaints')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('fullName', 'Full Name')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                {...register('name')}
                placeholder="Aarav Patel"
                className="civic-input pl-10"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
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
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('phoneNumber', 'Phone Number (Optional)')}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                {...register('phone')}
                placeholder="+91 9876543210"
                className="civic-input pl-10"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('password', 'Create Password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Min 8 characters, uppercase, number, symbol"
                className="civic-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 rounded-md transition-colors"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('confirmPassword', 'Confirm Password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Repeat password"
                className="civic-input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 rounded-md transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="civic-btn-primary w-full py-2.5 mt-2"
          >
            {loading ? t('common:loading', 'Registering Account...') : t('registerButton', 'Create Citizen Account')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
              {t('orContinueWith', 'or continue with')}
            </span>
          </div>
        </div>

        {/* Google Sign Up Button */}
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
          <span>{googleLoading ? t('common:loading', 'Connecting...') : t('googleLogin', 'Sign up with Google')}</span>
        </button>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {t('alreadyHaveAccount', 'Already registered?')}{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            {t('loginButton', 'Sign In here')}
          </Link>
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
