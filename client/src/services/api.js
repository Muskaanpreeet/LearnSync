import axios from 'axios';

// Single Axios instance used by every service (authService,
// courseService, etc). Components never import axios directly or
// hardcode the backend URL — everything goes through here.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('learnsync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globally handle an expired/invalid session: clear local storage and
// send the user back to login, instead of every page having to check
// for a 401 itself.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('learnsync_token');
      localStorage.removeItem('learnsync_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
