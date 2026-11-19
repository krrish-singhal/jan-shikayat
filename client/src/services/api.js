import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Safely parse JWT exp field (milliseconds)
 */
export function getTokenExpiry(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.exp ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Single-flight refresh mutex
let refreshPromise = null;

/**
 * Performs token refresh coalescing concurrent calls into a single request
 */
export async function performTokenRefresh() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post(
        `${baseURL}/auth/refresh`,
        { refreshToken: storedRefreshToken || undefined },
        { withCredentials: true }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response.data?.data || {};

      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken);
        if (api.defaults.headers.common) {
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        }
      }

      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Notify AuthContext of session update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth:token-refreshed', {
            detail: { accessToken: newAccessToken, user },
          })
        );
      }

      return newAccessToken;
    } catch (refreshErr) {
      const status = refreshErr.response?.status;
      const errorCode = refreshErr.response?.data?.error?.code;

      // Only clear storage if explicitly rejected as unauthenticated/invalid/revoked
      // Do NOT clear session on offline / network error / 5xx server issues
      if (
        status === 401 ||
        status === 403 ||
        errorCode === 'INVALID_TOKEN' ||
        errorCode === 'TOKEN_EXPIRED' ||
        errorCode === 'TOKEN_REUSE_DETECTED' ||
        errorCode === 'ACCOUNT_INVALID'
      ) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }
      throw refreshErr;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Helper to set Authorization header across Axios versions / AxiosHeaders
function setAuthHeader(headers, token) {
  if (!headers) return;
  const val = `Bearer ${token}`;
  if (typeof headers.set === 'function') {
    headers.set('Authorization', val);
  } else {
    headers.Authorization = val;
    headers['Authorization'] = val;
  }
}

// Request interceptor: proactive refresh if token expires in < 60s
api.interceptors.request.use(
  async (config) => {
    const url = config.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/staff/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/register');

    if (!isAuthEndpoint) {
      let token = localStorage.getItem('accessToken');
      if (token) {
        const expiry = getTokenExpiry(token);
        // If token expires in less than 60 seconds (or has expired), refresh before dispatch
        if (expiry && expiry - Date.now() < 60 * 1000) {
          try {
            token = await performTokenRefresh();
          } catch {
            // Proactive refresh failed (e.g. offline). Continue with existing token
            // so we don't break offline/cached requests prematurely
          }
        }
      }

      if (token) {
        setAuthHeader(config.headers, token);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: automatic token rotation on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(new Error('Network error. Backend server may be offline.'));
    }

    const { status, data } = error.response;
    const errorCode = data?.error?.code;

    const url = originalRequest?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/staff/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/register');

    if (
      status === 401 &&
      (errorCode === 'TOKEN_EXPIRED' || errorCode === 'UNAUTHORIZED') &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const currentToken = localStorage.getItem('accessToken');
        const authHeader =
          originalRequest.headers?.Authorization ||
          originalRequest.headers?.authorization;
        const requestToken =
          typeof authHeader === 'string'
            ? authHeader.replace(/^Bearer\s+/i, '')
            : null;

        let tokenToUse = currentToken;
        // If the access token hasn't changed since this request was sent, perform a refresh
        if (!currentToken || currentToken === requestToken) {
          tokenToUse = await performTokenRefresh();
        }

        if (tokenToUse) {
          setAuthHeader(originalRequest.headers, tokenToUse);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
