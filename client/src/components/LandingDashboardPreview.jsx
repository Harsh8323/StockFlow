import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  BarChart3,
  IndianRupee,
  TrendingUp,
  Bell,
} from 'lucide-react';

const KPI_DATA = [
  {
    label: 'Revenue this month',
    value: '₹4.97L',
    sub: 'Last month: ₹4.19L',
    icon: IndianRupee,
    tone: 'emerald',
    trend: 18.4,
  },
  {
    label: 'Orders this month',
    value: '1,432',
    sub: '38 pending',
    icon: ShoppingCart,
    tone: 'brand',
    trend: 12.5,
  },
  {
    label: 'Active customers',
    value: '186',
    sub: '24 new this month',
    icon: Users,
    tone: 'indigo',
  },
  {
    label: 'Inventory alerts',
    value: '12',
    sub: '3 out of stock',
    icon: Package,
    tone: 'amber',
  },
];

const formatShortDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
};

function generateSalesData(days) {
  const data = [];
  const now = new Date();
  let base = 4000;
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    base += (Math.random() - 0.45) * 1800;
    base = Math.max(1500, Math.min(15000, base));
    data.push({
      date: d.toISOString().split('T')[0],
      revenue: Math.round(base),
    });
  }
  return data;
}

const salesData = generateSalesData(30);

const ORDERS = [
  {
    inv: 'INV-2026-042',
    customer: 'Metro Supplies',
    amount: '₹12,450',
    status: 'Processing',
    statusClass: 'bg-sky-500/15 text-sky-300',
    payment: 'Paid',
    paymentClass: 'bg-emerald-500/15 text-emerald-300',
  },
  {
    inv: 'INV-2026-041',
    customer: 'Green Mart',
    amount: '₹8,200',
    status: 'Shipped',
    statusClass: 'bg-indigo-500/15 text-indigo-300',
    payment: 'Paid',
    paymentClass: 'bg-emerald-500/15 text-emerald-300',
  },
  {
    inv: 'INV-2026-040',
    customer: 'City Retail',
    amount: '₹24,100',
    status: 'Delivered',
    statusClass: 'bg-emerald-500/15 text-emerald-300',
    payment: 'Paid',
    paymentClass: 'bg-emerald-500/15 text-emerald-300',
  },
  {
    inv: 'INV-2026-039',
    customer: 'Quick Store',
    amount: '₹5,680',
    status: 'Pending',
    statusClass: 'bg-amber-500/15 text-amber-300',
    payment: 'Unpaid',
    paymentClass: 'bg-rose-500/15 text-rose-300',
  },
];

const TOP_PRODUCTS = [
  { rank: 1, name: 'Premium Headphones', sold: 48, revenue: '₹96,000' },
  { rank: 2, name: 'Wireless Mouse', sold: 36, revenue: '₹28,800' },
  { rank: 3, name: 'USB-C Hub', sold: 29, revenue: '₹34,800' },
  { rank: 4, name: 'Mechanical Keyboard', sold: 22, revenue: '₹55,000' },
  { rank: 5, name: 'Monitor Stand', sold: 18, revenue: '₹27,000' },
];

const STATUS_SEGMENTS = [
  { label: 'Delivered', pct: 52, color: '#10b981' },
  { label: 'Processing', pct: 28, color: '#0ea5e9' },
  { label: 'Pending', pct: 14, color: '#f59e0b' },
  { label: 'Cancelled', pct: 6, color: '#94a3b8' },
];

const NAV = [
  { icon: LayoutDashboard, active: true },
  { icon: Package, active: false },
  { icon: ShoppingCart, active: false },
  { icon: Users, active: false },
  { icon: Boxes, active: false },
  { icon: BarChart3, active: false },
];

const toneIcon = {
  brand: 'bg-brand-500/15 text-brand-400',
  indigo: 'bg-indigo-500/15 text-indigo-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  amber: 'bg-amber-500/15 text-amber-400',
};

const R = 36;
const CIRCUMFERENCE = 2 * Math.PI * R;

function DonutChart({ segments, size = 100, strokeWidth = 8 }) {
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      {segments.map((seg) => {
        const len = (seg.pct / 100) * CIRCUMFERENCE;
        const dash = `${len} ${CIRCUMFERENCE - len}`;
        const el = (
          <circle
            key={seg.label}
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += len;
        return el;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white text-[18px] font-bold">
        100%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-500 text-[9px]">
        Total
      </text>
    </svg>
  );
}

export default function LandingDashboardPreview() {
  const [salesRange, setSalesRange] = useState(30);
  const filteredData = salesData.slice(-salesRange);
  const totalRev = filteredData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = Math.round(totalRev / 347);

  return (
    <div className="relative mx-auto mt-14 w-full max-w-5xl px-4 sm:mt-16 sm:px-2">
      <div
        className="pointer-events-none absolute -inset-x-4 top-1/2 -z-10 h-3/4 -translate-y-1/2 rounded-full bg-brand-500/25 blur-[80px] sm:blur-[100px]"
        aria-hidden
      />

      <div
        className="dashboard-preview overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated shadow-glow-lg"
      >
        <div className="flex items-center gap-2 border-b border-white/10 bg-surface-card px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center rounded-md bg-surface-base px-3 text-[10px] text-slate-500 sm:max-w-sm">
            app.stockflow.io/dashboard
          </div>
        </div>

        <div className="flex min-h-[280px] sm:min-h-[380px]">
          <aside className="hidden w-14 shrink-0 flex-col border-r border-white/10 bg-surface-card py-3 sm:flex md:w-16">
            <div className="mb-4 flex justify-center">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
                <Boxes className="h-4 w-4" />
              </span>
            </div>
            <nav className="flex flex-1 flex-col items-center gap-1 px-1.5">
              {NAV.map(({ icon: Icon, active }, i) => (
                <span
                  key={i}
                  className={`grid h-9 w-9 place-items-center rounded-lg ${
                    active ? 'bg-brand-500 text-white shadow-glow-sm' : 'text-slate-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 bg-surface-base p-3 sm:p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <div>
                <p className="text-[10px] text-slate-500 sm:text-xs">Welcome back, Admin</p>
                <h3 className="text-sm font-semibold text-white sm:text-base">Dashboard</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-surface-card text-slate-400">
                  <Bell className="h-3.5 w-3.5" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  AD
                </span>
              </div>
            </div>

            {/* KPI cards — matches real dashboard layout */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 sm:gap-3">
              {KPI_DATA.map(({ label, value, sub, icon: Icon, tone, trend }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-surface-card p-2 sm:p-3"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 ${toneIcon[tone]}`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    {typeof trend === 'number' && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px] ${
                          trend >= 0
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        <TrendingUp className={`h-2.5 w-2.5 ${trend < 0 ? 'rotate-180' : ''}`} />
                        {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base font-bold text-white sm:text-lg">{value}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">{label}</p>
                  {sub && <p className="mt-0.5 truncate text-[9px] text-slate-600 sm:text-[10px]">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Sales chart + Order status donut — mirrors real dashboard layout */}
            <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-surface-card p-2 sm:p-3 lg:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-white sm:text-sm">Sales over time</p>
                  <div className="flex items-center gap-1">
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSalesRange(d)}
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium transition sm:px-2 sm:text-[10px] ${
                          salesRange === d
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[90px] sm:h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="previewRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      minTickGap={25}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                      width={35}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid rgba(148,163,184,0.3)',
                        background: '#1e293b',
                        fontSize: 11,
                      }}
                      labelFormatter={(d) => formatShortDate(d)}
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString('en-IN')}`,
                        'Revenue',
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#previewRev)" />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  <span className="font-medium text-slate-300">
                    ₹{totalRev.toLocaleString('en-IN')}
                  </span>{' '}
                  from{' '}
                  <span className="font-medium text-slate-300">
                    {totalOrders.toLocaleString('en-IN')}
                  </span>{' '}
                  orders over the last {salesRange} days.
                </p>
              </div>

              <div className="hidden rounded-xl border border-white/10 bg-surface-card p-2 sm:p-3 sm:block">
                <p className="text-[10px] font-medium text-white sm:text-xs">Order status mix</p>
                <div className="mt-2 flex flex-col items-center gap-2">
                  <div className="h-20 w-20 shrink-0 sm:h-28 sm:w-28">
                    <DonutChart segments={STATUS_SEGMENTS} />
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 sm:flex-col sm:gap-1.5">
                    {STATUS_SEGMENTS.map((seg) => (
                      <div key={seg.label} className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-[10px] text-slate-400">{seg.label}</span>
                        <span className="text-[10px] text-slate-500">{seg.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent orders + Top sellers — matches real dashboard layout */}
            <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-surface-card lg:col-span-2">
                <div className="border-b border-white/10 px-2 py-1.5 sm:px-4 sm:py-2">
                  <p className="text-[10px] font-medium text-white sm:text-xs">Recent orders</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px] sm:min-w-[460px] sm:text-xs">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="px-2 py-1.5 font-medium sm:px-4 sm:py-2">Invoice</th>
                        <th className="px-2 py-1.5 font-medium sm:px-4 sm:py-2">Customer</th>
                        <th className="px-2 py-1.5 font-medium text-right sm:px-4 sm:py-2">Total</th>
                        <th className="px-2 py-1.5 font-medium sm:px-4 sm:py-2">Status</th>
                        <th className="hidden px-2 py-1.5 font-medium sm:table-cell sm:px-4 sm:py-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ORDERS.map((row) => (
                        <tr key={row.inv} className="text-slate-300">
                          <td className="px-2 py-1.5 font-mono text-brand-400/90 sm:px-4 sm:py-2">{row.inv}</td>
                          <td className="px-2 py-1.5 sm:px-4 sm:py-2">{row.customer}</td>
                          <td className="px-2 py-1.5 text-right sm:px-4 sm:py-2">{row.amount}</td>
                          <td className="px-2 py-1.5 sm:px-4 sm:py-2">
                            <span
                              className={`inline-block rounded-full px-1.5 py-0.5 text-[8px] font-medium sm:px-2 sm:text-[10px] ${row.statusClass}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="hidden px-2 py-1.5 sm:table-cell sm:px-4 sm:py-2">
                            <span
                              className={`inline-block rounded-full px-1.5 py-0.5 text-[8px] font-medium sm:px-2 sm:text-[10px] ${row.paymentClass}`}
                            >
                              {row.payment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="hidden rounded-xl border border-white/10 bg-surface-card p-3 lg:block">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-xs font-medium text-white">Top sellers (30d)</p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {TOP_PRODUCTS.map((p) => (
                    <li key={p.rank} className="flex items-center gap-2.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-[10px] font-semibold text-slate-400">
                        {p.rank}
                      </span>
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/5 text-slate-500">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {p.sold} sold &middot; {p.revenue}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
