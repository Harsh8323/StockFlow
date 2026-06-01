import api from './api.js';

export const listCustomers = (params = {}) =>
  api.get('/customers', { params }).then((r) => r.data);

export const getCustomer = (id) =>
  api.get(`/customers/${id}`).then((r) => r.data.customer);

export const getCustomerOrders = (id, params = {}) =>
  api.get(`/customers/${id}/orders`, { params }).then((r) => r.data);

export const createCustomer = (payload) =>
  api.post('/customers', payload).then((r) => r.data.customer);

export const updateCustomer = (id, payload) =>
  api.put(`/customers/${id}`, payload).then((r) => r.data.customer);

export const deleteCustomer = (id) =>
  api.delete(`/customers/${id}`).then((r) => r.data);
