import api from './api.js';

export const USER_ROLES = ['admin', 'staff'];

const cleanParams = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );

export const listUsers = (params = {}) =>
  api.get('/users', { params: cleanParams(params) }).then((r) => r.data);

export const getUser = (id) =>
  api.get(`/users/${id}`).then((r) => r.data.user);

export const createUser = (payload) =>
  api.post('/users', payload).then((r) => r.data.user);

export const updateUser = (id, payload) =>
  api.put(`/users/${id}`, payload).then((r) => r.data.user);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`).then((r) => r.data);
