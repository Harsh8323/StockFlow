import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import ProductForm from '../components/ProductForm.jsx';
import Select from '../components/Select.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

import useDebounce from '../hooks/useDebounce.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listProducts,
  listCategories,
  deleteProduct,
} from '../services/productService.js';
import { formatCurrency, formatNumber, resolveImageUrl } from '../utils/format.js';

const STATUSES = [
  { value: '',             label: 'All statuses' },
  { value: 'active',       label: 'Active' },
  { value: 'inactive',     label: 'Inactive' },
  { value: 'discontinued', label: 'Discontinued' },
];

const SORT_OPTIONS = [
  { value: 'createdAt',     label: 'Newest' },
  { value: 'productName',   label: 'Name' },
  { value: 'price',         label: 'Price' },
  { value: 'stockQuantity', label: 'Stock' },
  { value: 'updatedAt',     label: 'Recently updated' },
];

const StatusPill = ({ value }) => {
  const map = {
    active:       'badge-emerald',
    inactive:     'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 badge',
    discontinued: 'badge-rose',
  };
  return <span className={`${map[value] || 'badge'} capitalize`}>{value || 'unknown'}</span>;
};

export default function Products() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Query state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const debouncedSearch = useDebounce(search, 350);

  // Data state
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      category: category || undefined,
      status: status || undefined,
      lowStock: lowStockOnly || undefined,
      sortBy,
      sortOrder,
    }),
    [page, limit, debouncedSearch, category, status, lowStockOnly, sortBy, sortOrder]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listProducts(queryParams);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load products');
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await listCategories();
      setCategories(data);
    } catch {
      /* non-blocking */
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status, lowStockOnly, sortBy, sortOrder, limit]);

  const onSaved = () => {
    fetchCategories();
    fetchData();
  };

  const onConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct(deleting._id);
      toast.success('Product deleted');
      setDeleting(null);
      // If we removed the last row on this page, step back a page.
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const toggleSortField = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortHeader = ({ field, children, className = '' }) => {
    const active = sortBy === field;
    return (
      <button
        type="button"
        onClick={() => toggleSortField(field)}
        className={`flex items-center gap-1 text-left hover:text-slate-700 dark:hover:text-slate-200 ${
          active ? 'text-slate-700 dark:text-slate-200' : ''
        } ${className}`}
      >
        {children}
        {active &&
          (sortOrder === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    );
  };

  const filtersActive =
    !!debouncedSearch || !!category || !!status || lowStockOnly;

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setLowStockOnly(false);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your catalog: SKUs, pricing, stock, and suppliers."
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchData}
              aria-label="Refresh"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add product
            </button>
          </>
        }
      />

      <div className="card mb-4">
        <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-12">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search name, SKU, category, supplier..."
            className="lg:col-span-4"
          />

          <Select
            wrapperClassName="lg:col-span-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Select
            wrapperClassName="lg:col-span-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>

          <Select
            wrapperClassName="lg:col-span-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </Select>

          <button
            type="button"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="btn-secondary lg:col-span-2"
            aria-label="Toggle sort order"
          >
            {sortOrder === 'asc' ? (
              <>
                <ArrowUp className="h-4 w-4" /> Ascending
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4" /> Descending
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Show only low-stock items
            </span>
          </label>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader label="Loading products..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-sm text-rose-600">
            {error}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title={filtersActive ? 'No products match your filters' : 'No products yet'}
            description={
              filtersActive
                ? 'Try clearing some filters to see more results.'
                : 'Add your first product to start tracking inventory.'
            }
            action={
              filtersActive ? (
                <button type="button" className="btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add product
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>
                      <SortHeader field="productName">Product</SortHeader>
                    </th>
                    <th>
                      <SortHeader field="category">Category</SortHeader>
                    </th>
                    <th className="text-right">
                      <SortHeader field="price" className="ml-auto">Price</SortHeader>
                    </th>
                    <th className="text-right">
                      <SortHeader field="stockQuantity" className="ml-auto">Stock</SortHeader>
                    </th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                            {p.productImage ? (
                              <img
                                src={resolveImageUrl(p.productImage)}
                                alt={p.productName}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                              {p.productName}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              SKU: <span className="font-mono">{p.sku}</span>
                              {p.supplierName ? ` · ${p.supplierName}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                        {p.category}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        <div className="inline-flex items-center justify-end gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {formatNumber(p.stockQuantity)}
                          </span>
                          {p.isLowStock && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                              title={`Reorder level: ${p.reorderLevel}`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill value={p.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                            onClick={() => {
                              setEditing(p);
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ${p.productName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                              onClick={() => setDeleting(p)}
                              aria-label={`Delete ${p.productName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </>
        )}
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
        product={editing}
        categoriesHint={categories}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onConfirmDelete}
        title="Delete product?"
        description={
          deleting
            ? `“${deleting.productName}” will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete product"
      />
    </div>
  );
}
