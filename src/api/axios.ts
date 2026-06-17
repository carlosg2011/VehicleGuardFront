import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5128/api',
});

const MAX_RETRIES = 5;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as typeof err.config & { _retryCount?: number };

    const retryCount = config?._retryCount ?? 0;
    const isNetworkError = !err.response;
    const isRetryable = isNetworkError || err.response?.status === 503 || err.response?.status === 504;

    if (isRetryable && retryCount < MAX_RETRIES && config) {
      config._retryCount = retryCount + 1;
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return api(config);
    }

    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
