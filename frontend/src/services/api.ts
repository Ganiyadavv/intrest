import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { getToken, clearStorage } from '../storage/storage';
import * as RootNavigation from '../navigation/RootNavigation';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Non-blocking background warm-up ping for cloud servers (e.g. Render free tier spin-down)
let lastWarmUpTime = 0;
export const warmUpBackend = async (): Promise<void> => {
  const now = Date.now();
  // Don't re-ping if already pinged in the last 2 minutes
  if (now - lastWarmUpTime < 120000) return;
  lastWarmUpTime = now;

  try {
    const rootUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    if (typeof fetch !== 'undefined') {
      fetch(`${rootUrl}/health`, { method: 'GET' }).catch(() => {});
    } else {
      axios.get(`${rootUrl}/health`, { timeout: 10000 }).catch(() => {});
    }
  } catch {
    // Background ping, fail silently
  }
};

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      await clearStorage();
      // Navigate to Login screen and pass a message parameter
      RootNavigation.navigate('Auth', {
        screen: 'Login',
        params: { message: 'Session expired. Please login again.' },
      });
    }
    return Promise.reject(error);
  }
);

export default api;
