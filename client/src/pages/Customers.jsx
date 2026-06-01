import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import CustomerForm from '../components/CustomerForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Select from '../components/Select.jsx';

import useDebounce from '../hooks/useDebounce.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listCustomers,
  deleteCustomer,
} from '../services/customerService.js';
import { formatCurrency, formatNumber, formatDate } from '../utils/format.js';

const STATUS_OPTIONS = [
  { value: '',      label: 'All customers' },
  { value: 'true',  label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

const SORT_OPTIONS = [
  { value: 'createdAt',   label: 'Newest' },
  { value: 'name',        label: 'Name' },
  { value: 'totalOrders', label: 'Total orders' },
  { value: 'totalSpent',  label: 'Total spent' },
  { value: 'lastOrderAt', label: 'Last order' },
  { value: 'updatedAt',   label: 'Recently updated' },
];

const initials = (name = '?') =>
  String(name)
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

export default function Customers() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Query state
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // '' | 'true' | 'false'
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

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      isActive: activeFilter || undefined,
      sortBy,
      sortOrder,
    }),
    [page, limit, debouncedSearch, activeFilter, sortBy, sortOrder]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCustomers(queryParams);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeFilter, sortBy, sortOrder, limit]);

  const onSaved = () => fetchData();

  const onConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCustomer(deleting._id);
      toast.success('Customer deleted');
      setDeleting(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer');
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

  const filtersActive = !!debouncedSearch || activeFilter !== '';

  const clearFilters = () => {
    setSearch('');
    setActiveFilter('');
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Track your customer database. Order history wires up in Phase 4."
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
              Add customer
            </button>
          </>
        }
      />

      <div className="card mb-4">
        <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-12">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search name, email, phone, notes..."
            className="lg:col-span-5"
          />

          <Select
            wrapperClassName="lg:col-span-3"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
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

        {filtersActive && (
          <div className="flex items-center justify-end border-t border-slate-200 px-4 py-2 dark:border-slate-800">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader label="Loading customers..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-sm text-rose-600">
            {error}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtersActive ? 'No customers match your filters' : 'No customers yet'}
            description={
              filtersActive
                ? 'Try clearing some filters to see more results.'
                : 'Add your first customer to start tracking orders against them.'
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
                  Add customer
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 text-left">
                      <SortHeader field="name">Customer</SortHeader>
                    </th>
                    <th className="px-5 py-3 text-left">Contact</th>
                    <th className="px-5 py-3 text-left">Address</th>
                    <th className="px-5 py-3 text-right">
                      <SortHeader field="totalOrders" className="ml-auto">Orders</SortHeader>
                    </th>
                    <th className="px-5 py-3 text-right">
                      <SortHeader field="totalSpent" className="ml-auto">Total spent</SortHeader>
                    </th>
                    <th className="px-5 py-3 text-left">
                      <SortHeader field="lastOrderAt">Last order</SortHeader>
                    </th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  {items.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                            {initials(c.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 truncate font-medium text-slate-900 dark:text-slate-100">
                              {c.name}
                              {c.isActive === false && (
                                <span className="badge bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                  Inactive
                                </span>
                              )}
                            </p>
                            {c.notes && (
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {c.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-0.5 text-xs">
                          <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <a
                              href={`tel:${c.phone}`}
                              className="hover:text-brand-600 dark:hover:text-brand-400"
                            >
                              {c.phone}
                            </a>
                          </p>
                          {c.email && (
                            <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <a
                                href={`mailto:${c.email}`}
                                className="truncate hover:text-brand-600 dark:hover:text-brand-400"
                                title={c.email}
                              >
                                {c.email}
                              </a>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="max-w-xs px-5 py-3">
                        {c.address ? (
                          <p className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                            <span className="line-clamp-2">{c.address}</span>
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {formatNumber(c.totalOrders || 0)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {formatCurrency(c.totalSpent || 0)}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                        {c.lastOrderAt ? formatDate(c.lastOrderAt) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                            onClick={() => {
                              setEditing(c);
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ${c.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                              onClick={() => setDeleting(c)}
                              aria-label={`Delete ${c.name}`}
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

      <CustomerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
        customer={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onConfirmDelete}
        title="Delete customer?"
        description={
          deleting
            ? `“${deleting.name}” will be permanently removed. Their order history (when added in Phase 4) will lose this customer reference.`
            : ''
        }
        confirmLabel="Delete customer"
      />
    </div>
  );
}
