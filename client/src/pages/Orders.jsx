import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Loader from '../components/Loader.jsx';
import OrderStatusPill from '../components/OrderStatusPill.jsx';
import PaymentStatusPill from '../components/PaymentStatusPill.jsx';
import Select from '../components/Select.jsx';
import DatePicker from '../components/DatePicker.jsx';

import useDebounce from '../hooks/useDebounce.js';
import {
  listOrders,
  downloadInvoice,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from '../services/orderService.js';
import { formatCurrency, formatDate } from '../utils/format.js';

const SORT_OPTIONS = [
  { value: 'createdAt',     label: 'Newest' },
  { value: 'invoiceNumber', label: 'Invoice number' },
  { value: 'totalAmount',   label: 'Total amount' },
  { value: 'orderStatus',   label: 'Status' },
];

export default function Orders() {
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const debouncedSearch = useDebounce(search, 350);

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (order) => {
    if (downloadingId) return;
    setDownloadingId(order._id);
    try {
      await downloadInvoice(order._id, order.invoiceNumber);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      orderStatus: orderStatus || undefined,
      paymentStatus: paymentStatus || undefined,
      from: from || undefined,
      to: to || undefined,
      sortBy,
      sortOrder,
    }),
    [page, limit, debouncedSearch, orderStatus, paymentStatus, from, to, sortBy, sortOrder]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listOrders(queryParams);
      setItems(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, orderStatus, paymentStatus, from, to, sortBy, sortOrder, limit]);

  const filtersActive =
    !!debouncedSearch || !!orderStatus || !!paymentStatus || !!from || !!to;

  const clearFilters = () => {
    setSearch('');
    setOrderStatus('');
    setPaymentStatus('');
    setFrom('');
    setTo('');
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Track and fulfill customer orders. Creating an order deducts stock automatically."
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
            <Link to="/orders/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              New order
            </Link>
          </>
        }
      />

      <div className="card mb-4">
        <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-12">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search invoice, customer name, phone, email..."
            className="lg:col-span-4"
          />

          <Select
            wrapperClassName="lg:col-span-2"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>

          <Select
            wrapperClassName="lg:col-span-2"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
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

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
          <label className="flex min-w-0 items-center gap-2 text-slate-400">
            <span className="shrink-0 uppercase tracking-wide">From</span>
            <DatePicker
              wrapperClassName="min-w-[10rem] flex-1"
              className="py-1.5 text-xs"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Start date"
            />
          </label>
          <label className="flex min-w-0 items-center gap-2 text-slate-400">
            <span className="shrink-0 uppercase tracking-wide">To</span>
            <DatePicker
              wrapperClassName="min-w-[10rem] flex-1"
              className="py-1.5 text-xs"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="End date"
              min={from || undefined}
            />
          </label>
          <div className="flex-1" />
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
            <Loader label="Loading orders..." />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-sm text-rose-600">
            {error}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={filtersActive ? 'No orders match your filters' : 'No orders yet'}
            description={
              filtersActive
                ? 'Try clearing some filters or widening the date range.'
                : 'Create your first order to start tracking sales and deducting stock.'
            }
            action={
              filtersActive ? (
                <button type="button" className="btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                <Link to="/orders/new" className="btn-primary">
                  <Plus className="h-4 w-4" />
                  New order
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 text-left">Invoice</th>
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Items</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Payment</th>
                    <th className="px-5 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  {items.map((o) => (
                    <tr
                      key={o._id}
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/orders/${o._id}`}
                          className="font-mono text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
                        >
                          {o.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {o.customerSnapshot?.name || o.customer?.name || '—'}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {o.customerSnapshot?.phone || o.customer?.phone || ''}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {o.items?.length ?? 0}
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-800 dark:text-slate-200">
                        {formatCurrency(o.totalAmount)}
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusPill status={o.orderStatus} />
                      </td>
                      <td className="px-5 py-3">
                        <PaymentStatusPill status={o.paymentStatus} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownload(o)}
                            disabled={downloadingId === o._id}
                            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                            aria-label={`Download invoice for ${o.invoiceNumber}`}
                          >
                            {downloadingId === o._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                          <Link
                            to={`/orders/${o._id}`}
                            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-300"
                            aria-label={`View ${o.invoiceNumber}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
