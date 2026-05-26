import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor – attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (data) => api.patch('/auth/preferences', data),
  changePassword: (data) => api.patch('/auth/password', data),
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  getConversations: (params = {}) => api.get('/chat/conversations', { params }),
  createConversation: (data = {}) => api.post('/chat/conversations', data),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  updateConversation: (id, data) => api.patch(`/chat/conversations/${id}`, data),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
  sendMessage: (convId, data) => api.post(`/chat/conversations/${convId}/messages`, data),
  rateMessage: (convId, msgId, data) => api.patch(`/chat/conversations/${convId}/messages/${msgId}/rate`, data),
  search: (q) => api.get('/chat/search', { params: { q } }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.patch(`/admin/users/${id}/toggle`),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

export default api;
