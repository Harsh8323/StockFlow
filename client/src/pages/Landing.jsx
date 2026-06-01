import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  FileText,
  Plus,
  Minus,
  Star,
  ArrowRight,
} from 'lucide-react';

import Logo from '../components/Logo.jsx';
import LandingDashboardPreview from '../components/LandingDashboardPreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#modules', label: 'Modules' },
  { href: '#faq', label: 'FAQ' },
];

const FEATURE_TABS = [
  { id: 'orders', label: 'Fast & secure orders', icon: ShoppingCart },
  { id: 'inventory', label: 'Real-time inventory', icon: Package },
  { id: 'insights', label: 'Actionable insights', icon: BarChart3 },
];

const PILLARS = [
  {
    icon: Zap,
    title: 'Fast operations',
    desc: 'Create orders, deduct stock, and update customers in one atomic flow â€” no spreadsheet gymnastics.',
  },
  {
    icon: TrendingUp,
    title: 'Low overhead',
    desc: 'Built for SMBs who need professional software without enterprise pricing or complexity.',
  },
  {
    icon: Shield,
    title: 'Secure & auditable',
    desc: 'Role-based access, JWT auth, and a complete inventory log for every stock movement.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Retail owner, Bengaluru',
    text: 'StockFlow replaced three spreadsheets. We finally know what is in stock before we promise a customer.',
    stars: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'Wholesale distributor',
    text: 'Invoice PDFs and order status workflow alone saved us hours every week. The dashboard is genuinely useful.',
    stars: 5,
  },
  {
    name: 'Anita Desai',
    role: 'Operations lead',
    text: 'Low-stock alerts and inventory logs mean we catch problems before they become angry phone calls.',
    stars: 5,
  },
  {
    name: 'Vikram Patel',
    role: 'E-commerce founder',
    text: 'Our staff uses the app daily. Admin controls for users and stock adjustments keep everything tidy.',
    stars: 5,
  },
  {
    name: 'Meera Iyer',
    role: 'Boutique manager',
    text: 'Clean UI, fast workflows, and GST-ready orders. It feels like software built for real shops, not demos.',
    stars: 5,
  },
  {
    name: 'Arjun Nair',
    role: 'Warehouse supervisor',
    text: 'Every stock change is logged. When something does not match, we can trace it in minutes.',
    stars: 5,
  },
];

const FAQS = [
  {
    q: 'What is StockFlow?',
    a: 'StockFlow is an inventory and order management platform for small and medium businesses. It covers products, customers, orders, stock tracking, invoices, and analytics in one place.',
  },
  {
    q: 'Do I need technical skills to use it?',
    a: 'No. If you can use email and a web browser, you can use StockFlow. The interface is designed for shop owners and operations staff, not developers.',
  },
  {
    q: 'How does stock tracking work?',
    a: 'Stock updates automatically when you create or cancel orders. Admins can also post manual adjustments with reasons. Every change is recorded in an append-only inventory log.',
  },
  {
    q: 'Can I export invoices?',
    a: 'Yes. Every order has a branded PDF invoice you can download from the orders list or order detail page.',
  },
  {
    q: 'What roles are supported?',
    a: 'Admin and Staff. Admins manage users, settings, analytics, and stock adjustments. Staff can run day-to-day operations on products, customers, and orders.',
  },
];


function ChartMock() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
  return (
    <div className="card-glass p-6 shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Sales overview</span>
        <span className="text-xs text-brand-400">+24% vs last period</span>
      </div>
      <div className="flex h-48 items-end justify-between gap-1.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-full rounded-t bg-gradient-to-t from-brand-600 to-brand-400 opacity-90"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [openFaq, setOpenFaq] = useState(0);

  const activeFeature = FEATURE_TABS.find((t) => t.id === activeTab) || FEATURE_TABS[0];

  return (
    <div className="min-h-screen bg-surface-base text-slate-100">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-surface-base/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo variant="light" />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-400 transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-sm !py-2 !px-5">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary text-sm !py-2 !px-5">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="absolute inset-0 bg-hero-glow" aria-hidden />
        <div className="landing-section text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-300">
            <Boxes className="h-3.5 w-3.5" />
            Inventory & order management reimagined
          </span>
          <h1 className="landing-heading mx-auto mt-8 max-w-4xl">
            <span className="text-gradient">Step into the future</span>
            <br />
            of inventory management
          </h1>
          <p className="landing-sub mx-auto">
            StockFlow centralizes products, orders, customers, and stock â€” with real-time
            analytics, audit logs, and branded invoices built for modern businesses.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-primary gap-2 px-8 py-3 text-base">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="btn-outline px-8 py-3 text-base">
              Explore features
            </a>
          </div>
          <LandingDashboardPreview />
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-white/5 py-10">
        <div className="landing-section">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">
            Trusted by retailers, wholesalers & growing brands
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
            {['Retail', 'Wholesale', 'E-commerce', 'Distribution', 'Workshops'].map((name) => (
              <span key={name} className="text-lg font-semibold text-slate-400">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature tabs */}
      <section id="features" className="py-24">
        <div className="landing-section">
          <h2 className="landing-heading text-center">Your journey to smarter ops starts here</h2>
          <p className="landing-sub mx-auto text-center">
            Everything you need to run inventory and orders â€” without the spreadsheet chaos.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {FEATURE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-glow-sm'
                    : 'border border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="card-glass mt-10 p-8 text-center md:p-12">
            <activeFeature.icon className="mx-auto h-12 w-12 text-brand-400" />
            <h3 className="mt-4 text-xl font-semibold text-white">{activeFeature.label}</h3>
            <p className="mx-auto mt-2 max-w-xl text-slate-400">
              {activeTab === 'orders' &&
                'Atomic order creation validates stock, generates invoice numbers, updates customer totals, and logs every movement.'}
              {activeTab === 'inventory' &&
                'Low-stock alerts, manual adjustments for admins, and a full movement history with search and filters.'}
              {activeTab === 'insights' &&
                'Dashboard KPIs, sales charts, top products, customer rankings, and deep analytics for admins.'}
            </p>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section id="modules" className="py-24">
        <div className="landing-section grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="landing-heading">Experience inventory made easy</h2>
            <p className="landing-sub">
              A professional dashboard with charts, tables, and workflows your team will actually
              enjoy using â€” day in, day out.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary">
                Start free
              </Link>
              <a href="#faq" className="btn-outline">
                Read FAQ
              </a>
            </div>
          </div>
          <ChartMock />
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24">
        <div className="landing-section">
          <h2 className="landing-heading text-center">Setting a new standard in digital operations</h2>
          <p className="landing-sub mx-auto text-center">
            Built for speed, clarity, and control â€” the way business software should feel.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card-glass group p-8 transition hover:border-brand-500/30 hover:shadow-glow-sm"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/25 transition group-hover:shadow-glow-sm">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual hub */}
      <section className="py-24">
        <div className="landing-section text-center">
          <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-2xl" />
            <span className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
              <Boxes className="h-14 w-14 text-white" />
            </span>
          </div>
          <h2 className="landing-heading mt-8">One platform. Every moving part.</h2>
          <p className="landing-sub mx-auto">
            Products, customers, orders, inventory logs, users, and PDF invoices â€” connected and
            consistent.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {[Package, ShoppingCart, Users, FileText, BarChart3, Shield].map((Icon, i) => (
              <span
                key={i}
                className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-surface-card text-brand-400"
              >
                <Icon className="h-5 w-5" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Audit */}
      <section className="py-24">
        <div className="landing-section grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="card-glass p-6">
              <p className="text-xs text-slate-500">Movement log</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-300">Order INV-2026-042</span>
                  <span className="text-rose-400">âˆ’2 units</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-300">Restock â€” PO-1023</span>
                  <span className="text-emerald-400">+50 units</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-300">Initial stock</span>
                  <span className="text-emerald-400">+100 units</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="landing-heading">Audit trail on every stock movement</h2>
            <p className="landing-sub">
              Automatic logs for orders, cancellations, and adjustments. Know who changed what,
              when, and why â€” with before/after balances.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="landing-section">
          <h2 className="landing-heading text-center">What our clients say</h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card-glass p-6">
                <div className="flex gap-0.5 text-brand-400">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-300">
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="landing-section max-w-3xl">
          <h2 className="landing-heading text-center">Frequently asked questions</h2>
          <div className="mt-12 space-y-3">
            {FAQS.map((item, i) => (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-white/10 bg-surface-card"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-white"
                >
                  {item.q}
                  {openFaq === i ? (
                    <Minus className="h-5 w-5 shrink-0 text-brand-400" />
                  ) : (
                    <Plus className="h-5 w-5 shrink-0 text-slate-500" />
                  )}
                </button>
                {openFaq === i && (
                  <p className="border-t border-white/5 px-5 pb-4 text-sm leading-relaxed text-slate-400">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 pb-8 pt-16">
        <div className="landing-section">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <Logo variant="light" />
              <p className="mt-3 text-sm text-slate-500">
                Modern inventory & order management for growing businesses.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-brand-400">Features</a></li>
                <li><a href="#modules" className="hover:text-brand-400">Modules</a></li>
                <li><Link to="/login" className="hover:text-brand-400">Log in</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li><a href="#faq" className="hover:text-brand-400">FAQ</a></li>
                <li><Link to="/register" className="hover:text-brand-400">Sign up</Link></li>
              </ul>
            </div>
          </div>
          <p className="footer-brand-glow" aria-hidden>
            StockFlow
          </p>
          <p className="mt-8 text-center text-xs text-slate-600">
            Â© {new Date().getFullYear()} StockFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
