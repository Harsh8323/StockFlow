import api from './api.js';

export const ORDER_STATUSES   = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

export const FINAL_STATUSES = new Set(['delivered', 'cancelled']);

export const STATUS_TRANSITIONS = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'cancelled'],
  delivered:  [],
  cancelled:  [],
};

export const listOrders = (params = {}) =>
  api.get('/orders', { params }).then((r) => r.data);

export const listRecentOrders = (limit = 5) =>
  api.get('/orders/recent', { params: { limit } }).then((r) => r.data.items || []);

export const getOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data.order);

export const createOrder = (payload) =>
  api.post('/orders', payload).then((r) => r.data.order);

export const updateOrderStatus = (id, payload) =>
  api.put(`/orders/${id}/status`, payload).then((r) => r.data);

/**
 * Download the order's invoice as a PDF. Fetched via axios so the auth
 * header travels with the request; the resulting blob is streamed to the
 * browser as a file download.
 */
export const downloadInvoice = async (id, invoiceNumber) => {
  const response = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoiceNumber || id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
