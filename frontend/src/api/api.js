import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавление токена к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email, password, serial_number) =>
    api.post('/auth/register', { email, password, serial_number }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getMe: () =>
    api.get('/auth/me')
};

// Users API
export const usersAPI = {
  getAll: () =>
    api.get('/users'),

  getById: (id) =>
    api.get(`/users/${id}`),

  update: (id, data) =>
    api.put(`/users/${id}`, data),

  delete: (id) =>
    api.delete(`/users/${id}`),

  toggleStatus: (id) =>
    api.patch(`/users/${id}/toggle-status`),

  getPermissions: (id) =>
    api.get(`/users/${id}/permissions`),

  updatePermissions: (id, data) =>
    api.put(`/users/${id}/permissions`, data)
};

// Categories API
export const categoriesAPI = {
  getAll: () =>
    api.get('/categories'),

  getActive: () =>
    api.get('/categories/active'),

  getById: (id) =>
    api.get(`/categories/${id}`),

  create: (data) =>
    api.post('/categories', data),

  update: (id, data) =>
    api.put(`/categories/${id}`, data),

  delete: (id) =>
    api.delete(`/categories/${id}`)
};

// Commands API
export const commandsAPI = {
  getAll: () =>
    api.get('/commands'),

  getActive: () =>
    api.get('/commands/active'),

  getById: (id) =>
    api.get(`/commands/${id}`),

  create: (data) =>
    api.post('/commands', data),

  update: (id, data) =>
    api.put(`/commands/${id}`, data),

  updateOrder: (commands) =>
    api.put('/commands/order', { commands }),

  delete: (id) =>
    api.delete(`/commands/${id}`),

  execute: (id) =>
    api.post(`/commands/${id}/execute`),

  getLogs: (id, limit = 50) =>
    api.get(`/commands/${id}/logs`, { params: { limit } }),

  getAllLogs: (limit = 100) =>
    api.get('/commands/logs/all', { params: { limit } })
};

// Devices API
export const devicesAPI = {
  getAll: () =>
    api.get('/devices'),

  create: (data) =>
    api.post('/devices', data),

  update: (id, data) =>
    api.put(`/devices/${id}`, data),

  delete: (id) =>
    api.delete(`/devices/${id}`)
};

// Firmware API
export const firmwareAPI = {
  getAll: () =>
    api.get('/firmware'),

  upload: (formData) =>
    api.post('/firmware/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  push: (id, device_id = null) =>
    api.post(`/firmware/${id}/push`, device_id ? { device_id } : {}),

  schedule: (id, device_id = null) =>
    api.post(`/firmware/${id}/schedule`, device_id ? { device_id } : {}),

  delete: (id) =>
    api.delete(`/firmware/${id}`),

  downloadUrl: (id) =>
    `${api.defaults.baseURL}/firmware/${id}/download`
};

export const emailSettingsAPI = {
  get: () => api.get('/email-settings'),
  save: (data) => api.put('/email-settings', data),
  test: (to) => api.post('/email-settings/test', { to })
};

export const telegramAPI = {
  getStatus: () => api.get('/telegram/status'),
  generateCode: () => api.post('/telegram/generate-code'),
  unlink: () => api.delete('/telegram/unlink')
};

export default api;
