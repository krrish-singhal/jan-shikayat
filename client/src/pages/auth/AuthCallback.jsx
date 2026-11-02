import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import api from '../../services/api.js';

export const AuthCallback = () => {
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
            localStorage.setItem('user', JSON.stringify(res.data.data.user));
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
        <span className="text-xs text-slate-500 font-medium">Completing Google authentication...</span>
      </div>
    </div>
  );
};
