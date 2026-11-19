import axios from 'axios';
import { logger } from '../utils/logger.js';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: attach accessToken and trace requests
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    const method = (config.method || 'GET').toUpperCase();
    logger.info(`[API Request] ${method} ${config.url}`);

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error('[API Request Error]', error.message || error);
    return Promise.reject(error);
  }
);

// Response interceptor: automatic token rotation on 401 TOKEN_EXPIRED
api.interceptors.response.use(
  (response) => {
    const elapsed = response.config?.metadata?.startTime
      ? `(${Date.now() - response.config.metadata.startTime}ms)`
      : '';
    const method = (response.config?.method || 'GET').toUpperCase();
    logger.info(`[API Response] ${response.status} ${method} ${response.config?.url} ${elapsed}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const method = (originalRequest?.method || 'GET').toUpperCase();
    const url = originalRequest?.url || '';
    const httpStatus = error.response?.status || 'OFFLINE';
    const errorMsg = error.response?.data?.error?.message || error.message;

    logger.warn(`[API Response Error] ${httpStatus} ${method} ${url}: ${errorMsg}`);

    if (!error.response) {
      return Promise.reject(new Error('Network error. Backend server may be offline.'));
    }

    const { status, data } = error.response;
    const errorCode = data?.error?.code;

    if (
      status === 401 &&
      (errorCode === 'TOKEN_EXPIRED' || errorCode === 'UNAUTHORIZED') &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/staff/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
