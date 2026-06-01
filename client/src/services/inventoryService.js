import api from './api';

export const LOG_TYPES = ['system', 'manual'];

export const LOG_REASONS = [
  'initial',
  'order_placed',
  'order_cancelled',
  'restock',
  'damage',
  'return',
  'correction',
  'other',
];

export const MANUAL_REASONS = ['restock', 'damage', 'return', 'correction', 'other'];

export const REASON_LABELS = {
  initial:         'Initial stock',
  order_placed:    'Order placed',
  order_cancelled: 'Order cancelled',
  restock:         'Restock',
  damage:          'Damage / loss',
  return:          'Return',
  correction:      'Correction',
  other:           'Other',
};

const cleanParams = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );

export const fetchInventoryStats = async () => {
  const { data } = await api.get('/inventory/stats');
  return data;
};

export const fetchInventoryLogs = async (params = {}) => {
  const { data } = await api.get('/inventory/logs', { params: cleanParams(params) });
  return data;
};

export const createStockAdjustment = async (payload) => {
  const { data } = await api.post('/inventory/adjustments', payload);
  return data;
};
