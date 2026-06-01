import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Clock,
  PackageX,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import OrderStatusPill from '../components/OrderStatusPill.jsx';
import PaymentStatusPill from '../components/PaymentStatusPill.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchDashboardStats,
  fetchSalesOverTime,
  fetchTopProducts,
  fetchStatusBreakdown,
} from '../services/dashboardService.js';
import { listRecentOrders } from '../services/orderService.js';
import { listProducts } from '../services/productService.js';
import { formatCurrency, formatNumber, resolveImageUrl } from '../utils/format.js';

const STATUS_COLORS = {
  pending:    '#f59e0b',
  processing: '#0ea5e9',
  shipped:    '#6366f1',
  delivered:  '#10b981',
  cancelled:  '#94a3b8',
  unpaid:     '#ef4444',
  partial:    '#f59e0b',
  paid:       '#10b981',
};

const formatShortDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
};

const KPI = ({ icon: Icon, tone, label, value, sub, trend }) => {
  const tones = {
    brand:   'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    rose:    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
    indigo:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
  };
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
          {typeof trend === 'number' && Number.isFinite(trend) && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                trend >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              }`}
            >
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {sub && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </div>
  );
};

const ChartCard = ({ title, action, children, height = 280, loading }) => (
  <div className="card">
    <div className="card-header">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {action}
    </div>
    <div className="card-body">
      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <Loader label="Loading…" />
        </div>
      ) : (
        <div style={{ height }}>{children}</div>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [loading, setLoading] = useState({
    stats: true,
    sales: true,
    top: true,
    breakdown: true,
    recent: true,
    low: true,
  });

  const [salesRange, setSalesRange] = useState(30);

  const loadAll = useCallback(async () => {
    const tasks = [
      fetchDashboardStats().then((d) => {
        setStats(d);
      }).finally(() => setLoading((s) => ({ ...s, stats: false }))),
      fetchSalesOverTime(salesRange).then((d) => {
        setSales(d);
      }).finally(() => setLoading((s) => ({ ...s, sales: false }))),
      fetchTopProducts({ days: 30, limit: 5 }).then((d) => {
        setTopProducts(d.items || []);
      }).finally(() => setLoading((s) => ({ ...s, top: false }))),
      fetchStatusBreakdown().then((d) => {
        setBreakdown(d);
      }).finally(() => setLoading((s) => ({ ...s, breakdown: false }))),
      listRecentOrders(5).then((items) => {
        setRecentOrders(items || []);
      }).finally(() => setLoading((s) => ({ ...s, recent: false }))),
      listProducts({
        lowStock: true,
        status: 'active',
        sortBy: 'stockQuantity',
        sortOrder: 'asc',
        limit: 5,
      })
        .then((d) => setLowStock(d.items || []))
        .finally(() => setLoading((s) => ({ ...s, low: false }))),
    ];
    await Promise.allSettled(tasks);
  }, [salesRange]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const totalSalesRevenue = sales?.series?.reduce((sum, p) => sum + p.revenue, 0) || 0;
  const totalSalesOrders  = sales?.series?.reduce((sum, p) => sum + p.orders, 0) || 0;

  return (
    <div>
      <PageHeader
        title={`Hi ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="Live snapshot of your business — revenue, orders, customers, and inventory health."
      />

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={IndianRupee}
          tone="emerald"
          label="Revenue this month"
          value={loading.stats ? '—' : formatCurrency(stats?.revenue.thisMonth || 0)}
          trend={loading.stats ? undefined : stats?.revenue.pctChange}
          sub={loading.stats ? undefined : `Last month: ${formatCurrency(stats?.revenue.lastMonth || 0)}`}
        />
        <KPI
          icon={ShoppingCart}
          tone="brand"
          label="Orders this month"
          value={loading.stats ? '—' : formatNumber(stats?.orders.thisMonth || 0)}
          trend={loading.stats ? undefined : stats?.orders.pctChange}
          sub={loading.stats ? undefined : `${formatNumber(stats?.orders.pending || 0)} pending`}
        />
        <KPI
          icon={Users}
          tone="indigo"
          label="Active customers"
          value={loading.stats ? '—' : formatNumber(stats?.customers.active || 0)}
        />
        <KPI
          icon={Package}
          tone={stats?.inventory.lowStockCount ? 'amber' : 'brand'}
          label="Inventory alerts"
          value={loading.stats ? '—' : formatNumber(stats?.inventory.lowStockCount || 0)}
          sub={loading.stats ? undefined : `${formatNumber(stats?.inventory.outOfStockCount || 0)} out of stock`}
        />
      </div>

      {/* Sales chart + Status breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Sales over time"
            loading={loading.sales}
            action={
              <div className="flex items-center gap-1.5 text-xs">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSalesRange(d)}
                    className={`rounded-md px-2 py-1 font-medium transition ${
                      salesRange === d
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            }
          >
            {sales?.series?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales.series} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-slate-500 dark:text-slate-400"
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid rgba(148,163,184,0.3)',
                      fontSize: 12,
                    }}
                    labelFormatter={(d) => formatShortDate(d)}
                    formatter={(value, key) =>
                      key === 'revenue'
                        ? [formatCurrency(value), 'Revenue']
                        : [formatNumber(value), 'Orders']
                    }
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No sales recorded in this range yet.
              </div>
            )}
          </ChartCard>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {formatCurrency(totalSalesRevenue)}
            </span>{' '}
            from {formatNumber(totalSalesOrders)} orders over the last {salesRange} days.
          </p>
        </div>

        <ChartCard title="Order status mix" loading={loading.breakdown}>
          {breakdown?.orderStatus?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown.orderStatus}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {breakdown.orderStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} orders`, name]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.3)',
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}
                />
                <Legend
                  formatter={(v) => <span className="text-xs capitalize">{v}</span>}
                  iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No order data yet.
            </div>
          )}
        </ChartCard>
      </div>

      {/* Recent orders + Top products */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent orders</h2>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="card-body">
            {loading.recent ? (
              <div className="flex justify-center py-6"><Loader label="Loading…" /></div>
            ) : recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No orders yet. Create your first one to see it here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-4">Invoice</th>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4 text-right">Total</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="py-2.5 pr-4">
                          <Link
                            to={`/orders/${o._id}`}
                            className="font-mono text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
                          >
                            {o.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {o.customerSnapshot?.name || o.customer?.name || '—'}
                          </p>
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(o.totalAmount)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <OrderStatusPill status={o.orderStatus} />
                        </td>
                        <td className="py-2.5">
                          <PaymentStatusPill status={o.paymentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Top sellers (30d)
              </h2>
            </div>
          </div>
          <div className="card-body">
            {loading.top ? (
              <div className="flex justify-center py-6"><Loader label="Loading…" /></div>
            ) : topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No sales recorded in the last 30 days.
              </p>
            ) : (
              <ul className="space-y-3">
                {topProducts.map((p, i) => (
                  <li key={p._id} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {p.productImage ? (
                        <img src={resolveImageUrl(p.productImage)} alt={p.productName} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.productName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatNumber(p.units)} sold · {formatCurrency(p.revenue)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      <div className="mt-6 card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Low stock alerts
            </h2>
          </div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
          >
            Manage inventory <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="card-body">
          {loading.low ? (
            <div className="flex justify-center py-6"><Loader label="Loading…" /></div>
          ) : lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No products are currently below their reorder level.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((p) => {
                const out = (p.stockQuantity || 0) === 0;
                return (
                  <div key={p._id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800">
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {p.productImage ? (
                        <img src={resolveImageUrl(p.productImage)} alt={p.productName} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.productName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className={out ? 'font-semibold text-rose-600' : 'font-semibold text-amber-600'}>
                          {formatNumber(p.stockQuantity)}
                        </span>{' '}
                        / {formatNumber(p.reorderLevel)} reorder
                      </p>
                    </div>
                    {out && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                        <PackageX className="h-3 w-3" /> Out
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
