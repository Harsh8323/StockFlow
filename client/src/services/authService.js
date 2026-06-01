import api from './api.js';

export const register = (payload) =>
  api.post('/auth/register', payload).then((r) => r.data);

export const login = (payload) =>
  api.post('/auth/login', payload).then((r) => r.data);

export const fetchMe = () => api.get('/auth/me').then((r) => r.data);

export const updateProfile = (payload) =>
  api.put('/auth/me', payload).then((r) => r.data);

export const changePassword = (payload) =>
  api.put('/auth/me/password', payload).then((r) => r.data);
