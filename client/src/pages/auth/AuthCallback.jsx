import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import api from '../../services/api.js';
import i18n from '../../i18n.js';

export const AuthCallback = () => {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        addToast(decodeURIComponent(error), 'error');
        navigate('/login', { replace: true });
        return;
      }

      if (token) {
        try {
          localStorage.setItem('accessToken', token);
          const res = await api.get('/me');
          if (res.data?.success) {
            const userData = res.data.data.user;
            localStorage.setItem('user', JSON.stringify(userData));
            if (userData?.preferredLanguage) {
              i18n.changeLanguage(userData.preferredLanguage);
            }
            addToast('Successfully authenticated via Google OAuth', 'success');
            window.location.href = '/citizen/dashboard';
            return;
          }
        } catch (err) {
          addToast('Failed to complete OAuth authentication', 'error');
        }
      }

      navigate('/login', { replace: true });
    };

    handleCallback();
  }, [searchParams, navigate, addToast]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">{t('loading', 'Completing authentication...')}</span>
      </div>
    </div>
  );
};
