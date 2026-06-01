import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Users,
  Boxes,
  Package,
  Layers,
  Award,
  Crown,
  ArrowRight,
  Calendar,
  Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import {
  fetchDashboardStats,
  fetchSalesOverTime,
  fetchTopProducts,
  fetchStatusBreakdown,
  fetchTopCustomers,
  fetchRevenueByCategory,
} from '../services/dashboardService.js';
import { formatCurrency, formatNumber, formatDate, resolveImageUrl } from '../utils/format.js';

const RANGES = [
  { value: 7,   label: '7 days'   },
  { value: 30,  label: '30 days'  },
  { value: 90,  label: '90 days'  },
  { value: 180, label: '6 months' },
];

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

const CATEGORY_PALETTE = [
  '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#84cc16', '#ef4444', '#6366f1', '#14b8a6',
];

const formatShortDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
};

const KPI = ({ icon: Icon, tone, label, value, trend, sub }) => {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    brand:   'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
    indigo:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
    amber:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  };
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
          {Number.isFinite(trend) && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                trend >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              }`}
            >
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="mt-4 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {value}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {sub && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </div>
  );
};

const ChartCard = ({ title, icon: Icon, action, children, height = 300, loading, footer }) => (
  <div className="card">
    <div className="card-header">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
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
      {footer && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{footer}</p>
      )}
    </div>
  </div>
);

export default function Analytics() {
  const [range, setRange] = useState(30);

  const [stats, setStats]                 = useState(null);
  const [sales, setSales]                 = useState(null);
  const [orderStatus, setOrderStatus]     = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [topProducts, setTopProducts]     = useState([]);
  const [topCustomers, setTopCustomers]   = useState([]);
  const [categories, setCategories]       = useState([]);

  const [loading, setLoading] = useState({
    stats: true,
    sales: true,
    breakdown: true,
    top: true,
    customers: true,
    categories: true,
  });

  const setOne = (k, v) => setLoading((s) => ({ ...s, [k]: v }));

  const loadAll = useCallback(() => {
    setLoading({
      stats: true,
      sales: true,
      breakdown: true,
      top: true,
      customers: true,
      categories: true,
    });

    fetchDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setOne('stats', false));

    fetchSalesOverTime(range)
      .then(setSales)
      .catch(() => setSales(null))
      .finally(() => setOne('sales', false));

    fetchStatusBreakdown()
      .then((d) => {
        setOrderStatus(d.orderStatus || []);
        setPaymentStatus(d.paymentStatus || []);
      })
      .catch(() => { setOrderStatus([]); setPaymentStatus([]); })
      .finally(() => setOne('breakdown', false));

    fetchTopProducts({ days: range, limit: 10 })
      .then((d) => setTopProducts(d.items || []))
      .catch(() => setTopProducts([]))
      .finally(() => setOne('top', false));

    fetchTopCustomers({ days: range, limit: 10 })
      .then((d) => setTopCustomers(d.items || []))
      .catch(() => setTopCustomers([]))
      .finally(() => setOne('customers', false));

    fetchRevenueByCategory({ days: range })
      .then((d) => setCategories(d.items || []))
      .catch(() => setCategories([]))
      .finally(() => setOne('categories', false));
  }, [range]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Derived totals from the current sales window.
  const periodRevenue = useMemo(
    () => (sales?.series || []).reduce((s, p) => s + p.revenue, 0),
    [sales]
  );
  const periodOrders = useMemo(
    () => (sales?.series || []).reduce((s, p) => s + p.orders, 0),
    [sales]
  );
  const avgOrderValue = periodOrders > 0 ? periodRevenue / periodOrders : 0;

  const totalCategoryRevenue = useMemo(
    () => categories.reduce((s, c) => s + c.revenue, 0),
    [categories]
  );

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deep-dive into revenue, orders, customers, and product performance."
        actions={
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-900">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  range === r.value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Period summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={IndianRupee}
          tone="emerald"
          label={`Revenue in last ${range} days`}
          value={loading.sales ? '—' : formatCurrency(periodRevenue)}
          sub={loading.stats ? undefined : `All-time: ${formatCurrency(stats?.revenue.allTime || 0)}`}
        />
        <KPI
          icon={ShoppingCart}
          tone="brand"
          label={`Orders in last ${range} days`}
          value={loading.sales ? '—' : formatNumber(periodOrders)}
          sub={loading.stats ? undefined : `${formatNumber(stats?.orders.pending || 0)} pending right now`}
        />
        <KPI
          icon={Receipt}
          tone="indigo"
          label="Average order value"
          value={loading.sales ? '—' : formatCurrency(avgOrderValue)}
          sub={`Across ${formatNumber(periodOrders)} orders`}
        />
        <KPI
          icon={Users}
          tone="amber"
          label="Active customers"
          value={loading.stats ? '—' : formatNumber(stats?.customers.active || 0)}
          sub={loading.stats ? undefined : `${formatNumber(stats?.inventory.activeProducts || 0)} active products`}
        />
      </div>

      {/* Sales over time — dual axis */}
      <div className="mt-6">
        <ChartCard
          title="Revenue & order volume over time"
          icon={TrendingUp}
          loading={loading.sales}
          height={340}
          footer={
            sales?.series?.length
              ? `${formatCurrency(periodRevenue)} from ${formatNumber(periodOrders)} orders · avg ${formatCurrency(avgOrderValue)} / order`
              : undefined
          }
        >
          {sales?.series?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sales.series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
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
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  width={48}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                  width={32}
                  allowDecimals={false}
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
                <Legend
                  iconSize={10}
                  formatter={(v) => <span className="text-xs capitalize">{v}</span>}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#rev-area)"
                />
                <Bar
                  yAxisId="right"
                  dataKey="orders"
                  name="orders"
                  fill="#0ea5e9"
                  fillOpacity={0.5}
                  radius={[3, 3, 0, 0]}
                  barSize={range > 60 ? 4 : 10}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No revenue or orders recorded in this range yet.
            </div>
          )}
        </ChartCard>
      </div>

      {/* Status mix pies + Revenue by category */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Order status mix" icon={ShoppingCart} loading={loading.breakdown}>
          {orderStatus.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  label={(entry) => entry.count}
                >
                  {orderStatus.map((e) => (
                    <Cell key={e.status} fill={STATUS_COLORS[e.status] || '#94a3b8'} />
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
                  iconSize={10}
                  formatter={(v) => <span className="text-xs capitalize">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No orders yet.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Payment status mix" icon={Receipt} loading={loading.breakdown}>
          {paymentStatus.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatus}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  label={(entry) => entry.count}
                >
                  {paymentStatus.map((e) => (
                    <Cell key={e.status} fill={STATUS_COLORS[e.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} orders (${formatCurrency(props.payload?.value || 0)})`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.3)',
                    fontSize: 12,
                    textTransform: 'capitalize',
                  }}
                />
                <Legend
                  iconSize={10}
                  formatter={(v) => <span className="text-xs capitalize">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No payments to break down yet.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Revenue by category" icon={Layers} loading={loading.categories}>
          {categories.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categories.slice(0, 8)}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-slate-500 dark:text-slate-400"
                  width={84}
                />
                <Tooltip
                  formatter={(value, _key, props) => [
                    `${formatCurrency(value)} · ${formatNumber(props.payload?.units || 0)} units`,
                    props.payload?.category,
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.3)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {categories.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No sales by category in this range.
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top products + Top customers tables */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top products */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Top products ({range} d)
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="card-body">
            {loading.top ? (
              <div className="flex justify-center py-10"><Loader label="Loading top products…" /></div>
            ) : topProducts.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No products sold in the last {range} days.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Product</th>
                      <th className="py-2 pr-3 text-right">Units</th>
                      <th className="py-2 pr-3 text-right">Revenue</th>
                      <th className="py-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topProducts.map((p, i) => (
                      <tr key={p._id}>
                        <td className="py-2.5 pr-3 text-xs font-semibold text-slate-400">
                          {i + 1}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                              {p.productImage ? (
                                <img src={resolveImageUrl(p.productImage)} alt={p.productName} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                {p.productName}
                              </p>
                              <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                {p.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                          {formatNumber(p.units)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(p.revenue)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {typeof p.stockQuantity === 'number' ? (
                            <span className={
                              p.stockQuantity === 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-600 dark:text-slate-300'
                            }>
                              {formatNumber(p.stockQuantity)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top customers */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Top customers ({range} d)
              </h2>
            </div>
            <Link
              to="/customers"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="card-body">
            {loading.customers ? (
              <div className="flex justify-center py-10"><Loader label="Loading top customers…" /></div>
            ) : topCustomers.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No customer activity in the last {range} days.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3 text-right">Orders</th>
                      <th className="py-2 pr-3 text-right">Revenue</th>
                      <th className="py-2 text-right">Last order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topCustomers.map((c, i) => {
                      const initials = (c.name || 'C')
                        .split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
                      return (
                        <tr key={c._id || i}>
                          <td className="py-2.5 pr-3 text-xs font-semibold text-slate-400">
                            {i + 1}
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                                {initials}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                  {c.name || 'Customer'}
                                </p>
                                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                  {c.email || c.phone || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                            {formatNumber(c.orders)}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                            {formatCurrency(c.revenue)}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {formatDate(c.lastOrderAt)}
                            </span>
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
      </div>

      {/* Category share footer */}
      {!loading.categories && categories.length > 0 && (
        <div className="mt-6 card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Category share of revenue
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total {formatCurrency(totalCategoryRevenue)} across {categories.length} categories
            </span>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {categories.map((c, i) => {
                const pct = totalCategoryRevenue > 0 ? (c.revenue / totalCategoryRevenue) * 100 : 0;
                const color = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {c.category}
                      </span>
                      <span className="tabular-nums text-slate-600 dark:text-slate-400">
                        {formatCurrency(c.revenue)} · {formatNumber(c.units)} units · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
