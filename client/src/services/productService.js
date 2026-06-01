import api from './api.js';

const buildFormData = (payload, file) => {
  const fd = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    fd.append(key, value);
  });
  if (file) fd.append('productImage', file);
  return fd;
};

export const listProducts = (params = {}) =>
  api.get('/products', { params }).then((r) => r.data);

export const listCategories = () =>
  api.get('/products/categories').then((r) => r.data.categories || []);

export const listLowStock = (limit = 10) =>
  api.get('/products/low-stock', { params: { limit } }).then((r) => r.data.items || []);

export const getProduct = (id) =>
  api.get(`/products/${id}`).then((r) => r.data.product);

export const createProduct = ({ payload, file }) =>
  api
    .post('/products', buildFormData(payload, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.product);

export const updateProduct = (id, { payload, file }) =>
  api
    .put(`/products/${id}`, buildFormData(payload, file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.product);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((r) => r.data);
