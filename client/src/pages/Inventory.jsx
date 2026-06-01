import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Filter,
  Boxes,
  TrendingDown,
  XCircle,
  PackageX,
  PlusCircle,
  History,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import Loader from '../components/Loader.jsx';
import StockAdjustmentForm from '../components/StockAdjustmentForm.jsx';
import Select from '../components/Select.jsx';
import DatePicker from '../components/DatePicker.jsx';

import useDebounce from '../hooks/useDebounce.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchInventoryStats,
  fetchInventoryLogs,
  LOG_REASONS,
  REASON_LABELS,
} from '../services/inventoryService.js';
import { listProducts } from '../services/productService.js';
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
  resolveImageUrl,
} from '../utils/format.js';

const DIRECTION_OPTIONS = [
  { value: '',    label: 'All movements' },
  { value: 'in',  label: 'Stock in (+)' },
  { value: 'out', label: 'Stock out (−)' },
];

const TYPE_OPTIONS = [
  { value: '',       label: 'All sources' },
  { value: 'system', label: 'System' },
  { value: 'manual', label: 'Manual' },
];

const reasonBadgeClass = (reason) => {
  switch (reason) {
    case 'initial':
      return 'badge bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
    case 'order_placed':
      return 'badge bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200';
    case 'order_cancelled':
      return 'badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case 'restock':
      return 'badge-emerald';
    case 'damage':
      return 'badge-rose';
    case 'return':
      return 'badge bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200';
    case 'correction':
      return 'badge bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    default:
      return 'badge';
  }
};

const StatCard = ({ icon: Icon, label, value, tone = 'slate', sub }) => {
  const tones = {
    slate:   'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    brand:   'text-brand-700 dark:text-brand-200 bg-brand-100 dark:bg-brand-900/40',
    amber:   'text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40',
    rose:    'text-rose-700 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/40',
    emerald: 'text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/40',
  };
  return (
    <div className="card">
      <div className="card-body flex items-start gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

export default function Inventory() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Low stock list
  const [lowStock, setLowStock] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);

  // Log filters
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState('');
  const [direction, setDirection] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const debouncedSearch = useDebounce(search, 350);

  // Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  const [pagination, setPagination] = useState(null);

  // Modal
  const [adjustOpen, setAdjustOpen] = useState(false);

  const logParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      reason: reason || undefined,
      type: type || undefined,
      direction: direction || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [page, limit, debouncedSearch, reason, type, direction, from, to]
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await fetchInventoryStats();
      setStats(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadLowStock = useCallback(async () => {
    setLowStockLoading(true);
    try {
      const data = await listProducts({
        lowStock: true,
        status: 'active',
        sortBy: 'stockQuantity',
        sortOrder: 'asc',
        limit: 8,
      });
      setLowStock(data.items || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to load low-stock items');
    } finally {
      setLowStockLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const data = await fetchInventoryLogs(logParams);
      setLogs(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load inventory logs';
      setLogsError(msg);
      toast.error(msg);
    } finally {
      setLogsLoading(false);
    }
  }, [logParams]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadLowStock(); }, [loadLowStock]);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  useEffect(() => { setPage(1); }, [debouncedSearch, reason, type, direction, from, to]);

  const handleAdjusted = () => {
    loadStats();
    loadLowStock();
    loadLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setReason('');
    setType('');
    setDirection('');
    setFrom('');
    setTo('');
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock movements, low-stock alerts, and a complete inventory audit log."
        actions={
          isAdmin ? (
            <button
              type="button"
              onClick={() => setAdjustOpen(true)}
              className="btn-primary"
            >
              <PlusCircle className="h-4 w-4" /> Adjust stock
            </button>
          ) : null
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Active products"
          value={statsLoading ? '—' : formatNumber(stats?.totalActiveProducts || 0)}
          tone="brand"
        />
        <StatCard
          icon={Package}
          label="Total stock value"
          value={statsLoading ? '—' : formatCurrency(stats?.totalStockValue || 0)}
          tone="emerald"
          sub={statsLoading ? undefined : `${formatNumber(stats?.totalUnits || 0)} units on hand`}
        />
        <StatCard
          icon={TrendingDown}
          label="Low stock"
          value={statsLoading ? '—' : formatNumber(stats?.lowStockCount || 0)}
          tone="amber"
          sub="Below reorder level"
        />
        <StatCard
          icon={PackageX}
          label="Out of stock"
          value={statsLoading ? '—' : formatNumber(stats?.outOfStockCount || 0)}
          tone="rose"
        />
      </div>

      {/* Low stock alerts */}
      <div className="mt-6 card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Low-stock alerts
            </h2>
            {!lowStockLoading && lowStock.length > 0 && (
              <span className="badge-amber">{lowStock.length}</span>
            )}
          </div>
          <Link
            to="/products"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
          >
            View all products →
          </Link>
        </div>
        <div className="card-body">
          {lowStockLoading ? (
            <div className="flex justify-center py-6"><Loader label="Loading…" /></div>
          ) : lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Package className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                All stock levels look healthy
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                No products are currently below their reorder level.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4 text-right">Stock</th>
                    <th className="py-2 pr-4 text-right">Reorder at</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStock.map((p) => {
                    const out = (p.stockQuantity || 0) === 0;
                    return (
                      <tr key={p._id}>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                              {p.productImage ? (
                                <img
                                  src={resolveImageUrl(p.productImage)}
                                  alt={p.productName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                {p.productName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {p.category || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                          {p.sku}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          <span className={out ? 'font-semibold text-rose-600 dark:text-rose-400' : 'font-semibold text-amber-600 dark:text-amber-400'}>
                            {formatNumber(p.stockQuantity)}
                          </span>
                          {out && (
                            <span className="ml-1.5 badge bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                              Out
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-slate-600 dark:text-slate-400">
                          {formatNumber(p.reorderLevel)}
                        </td>
                        <td className="py-2.5 text-right">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => setAdjustOpen(true)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              <PlusCircle className="h-3 w-3" /> Adjust
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Movement history */}
      <div className="mt-6 card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Movement history
            </h2>
            {pagination && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                · {formatNumber(pagination.total)} entries
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
            <button
              type="button"
              onClick={loadLogs}
              disabled={logsLoading}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="card-body space-y-4">
          {/* Search + filters */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by product, SKU, or notes..."
          />

          {showFilters && (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Reason</label>
                <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">All reasons</option>
                  {LOG_REASONS.map((r) => (
                    <option key={r} value={r}>{REASON_LABELS[r]}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Source</label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Direction</label>
                <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
                  {DIRECTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">From</label>
                <DatePicker value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">To</label>
                <DatePicker value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" min={from || undefined} />
              </div>
              <div className="md:col-span-3 lg:col-span-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {logsLoading ? (
            <div className="flex justify-center py-10"><Loader label="Loading movement history…" /></div>
          ) : logsError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
                <XCircle className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Couldn't load inventory logs
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{logsError}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <History className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                No movements yet
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Create an order or adjust stock to generate the first log entry.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Reason</th>
                    <th className="py-2 pr-4 text-right">Change</th>
                    <th className="py-2 pr-4 text-right">Stock (before → after)</th>
                    <th className="py-2 pr-4">Reference</th>
                    <th className="py-2">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => {
                    const isIn = log.change > 0;
                    return (
                      <tr key={log._id}>
                        <td className="py-2.5 pr-4 align-top">
                          <span className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 align-top">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                              {log.product?.productImage ? (
                                <img
                                  src={resolveImageUrl(log.product.productImage)}
                                  alt={log.productName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                {log.productName}
                              </p>
                              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                {log.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 align-top">
                          <span className={`${reasonBadgeClass(log.reason)} whitespace-nowrap`}>
                            {REASON_LABELS[log.reason] || log.reason}
                          </span>
                          {log.notes && (
                            <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {log.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right align-top tabular-nums">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              isIn
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isIn ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                            {isIn ? '+' : ''}{formatNumber(log.change)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right align-top tabular-nums text-slate-600 dark:text-slate-400">
                          {formatNumber(log.stockBefore)} → {' '}
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {formatNumber(log.stockAfter)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 align-top">
                          {log.relatedOrder ? (
                            <Link
                              to={`/orders/${log.relatedOrder._id || log.relatedOrder}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {log.relatedOrder.invoiceNumber || 'View order'}
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 align-top">
                          {log.createdBy?.name ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <UserIcon className="h-3.5 w-3.5" />
                              {log.createdBy.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">System</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.total > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          )}
        </div>
      </div>

      {isAdmin && (
        <StockAdjustmentForm
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          onSaved={handleAdjusted}
        />
      )}
    </div>
  );
}
