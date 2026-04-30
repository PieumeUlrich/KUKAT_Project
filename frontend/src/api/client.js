import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kukat_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }).catch(err => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing    = true;

      const refreshToken = localStorage.getItem('kukat_refresh');

      if (!refreshToken) {
        localStorage.removeItem('kukat_token');
        localStorage.removeItem('kukat_refresh');
        localStorage.removeItem('kukat_user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // ← Use same env var for refresh — no hardcoded fallback URL
        const { data } = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/auth/refresh`,
          { refreshToken }
        );

        localStorage.setItem('kukat_token', data.token);
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        processQueue(null, data.token);

        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('kukat_token');
        localStorage.removeItem('kukat_refresh');
        localStorage.removeItem('kukat_user');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;