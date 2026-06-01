import api from './api.js';

const cleanParams = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );

export const fetchDashboardStats = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
};

export const fetchSalesOverTime = async (days = 30) => {
  const { data } = await api.get('/dashboard/sales-over-time', { params: cleanParams({ days }) });
  return data;
};

export const fetchTopProducts = async (params = {}) => {
  const { data } = await api.get('/dashboard/top-products', { params: cleanParams(params) });
  return data;
};

export const fetchStatusBreakdown = async () => {
  const { data } = await api.get('/dashboard/status-breakdown');
  return data;
};

export const fetchTopCustomers = async (params = {}) => {
  const { data } = await api.get('/dashboard/top-customers', { params: cleanParams(params) });
  return data;
};

export const fetchRevenueByCategory = async (params = {}) => {
  const { data } = await api.get('/dashboard/revenue-by-category', { params: cleanParams(params) });
  return data;
};
