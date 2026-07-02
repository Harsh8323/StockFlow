import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaBox,
  FaCartShopping,
  FaUsers,
  FaChartLine,
  FaClockRotateLeft,
  FaUserShield,
  FaStore,
  FaTruckFast,
  FaIndustry,
  FaBriefcase,
  FaStar,
  FaPlus,
  FaArrowRight,
  FaCircleCheck,
} from 'react-icons/fa6';

import { Hero } from '../components/Hero.jsx';
import Logo from '../components/Logo.jsx';
import bgImage from '../assets/hero-bg.png';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.12,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 70, damping: 20 },
  },
};

const FEATURES = [
  {
    icon: FaBox,
    title: 'Real-Time Inventory',
    desc: 'Track every SKU across your warehouse with automatic stock updates, low-stock alerts, and full movement history. Never oversell or run out of stock again.',
  },
  {
    icon: FaCartShopping,
    title: 'Order Management',
    desc: 'Create orders with atomic stock deduction, GST invoice generation, downloadable PDFs, and a complete status lifecycle from pending to delivered.',
  },
  {
    icon: FaUsers,
    title: 'Customer Insights',
    desc: 'Build rich customer profiles with order history, total spend, activity tracking, and contact management. Know your best customers at a glance.',
  },
  {
    icon: FaChartLine,
    title: 'Analytics & KPIs',
    desc: 'Revenue charts, top products, category breakdowns, and KPI cards with trend indicators. Make data-driven decisions with real-time business intelligence.',
  },
  {
    icon: FaClockRotateLeft,
    title: 'Audit Trail',
    desc: 'Every stock movement is logged with before/after balances, timestamps, and user attribution. Full transparency for compliance and troubleshooting.',
  },
  {
    icon: FaUserShield,
    title: 'Role-Based Access',
    desc: 'Admin and staff roles with granular permissions. Manage users, control access to sensitive features, and keep your team workflows secure.',
  },
];

const SOLUTIONS = [
  {
    icon: FaStore,
    title: 'Retail & E-Commerce',
    desc: 'Multi-channel inventory sync, real-time stock visibility across stores, and streamlined order fulfillment for modern retail operations.',
  },
  {
    icon: FaTruckFast,
    title: 'Wholesale Distribution',
    desc: 'Bulk order processing, supplier management, and volume-based pricing. Built for distributors who need speed without sacrificing accuracy.',
  },
  {
    icon: FaIndustry,
    title: 'Manufacturing',
    desc: 'Raw material tracking, production workflow management, and finished goods inventory. Connect procurement to production seamlessly.',
  },
  {
    icon: FaBriefcase,
    title: 'Small & Medium Business',
    desc: 'Professional inventory management without enterprise pricing or complexity. Set up in minutes, train your team in hours, and grow with confidence.',
  },
];

const FAQS = [
  {
    q: 'What is StockFlow?',
    a: 'StockFlow is a modern inventory and order management platform for small and medium businesses. It covers products, customers, orders, stock tracking, GST invoices, analytics, and team management in one integrated system.',
  },
  {
    q: 'Do I need technical skills to use it?',
    a: 'No. StockFlow is designed for shop owners, operations staff, and warehouse teams — not developers. The interface is clean, intuitive, and ready to use out of the box.',
  },
  {
    q: 'How does inventory tracking work?',
    a: 'Stock updates automatically when you create or cancel orders. Admins can also make manual adjustments with reason codes. Every change is recorded in an append-only inventory log with before/after balances.',
  },
  {
    q: 'Can I generate GST invoices?',
    a: 'Yes. Every order generates a branded PDF invoice with GST breakdown, itemized totals, and your business details. Invoices are available for download from the orders list and order detail page.',
  },
  {
    q: 'What user roles are supported?',
    a: 'Admin and Staff. Admins have full access to manage users, settings, analytics, and stock adjustments. Staff can handle day-to-day operations on products, customers, and orders.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. StockFlow uses JWT-based authentication, role-based access control, and MongoDB with encrypted connections. All stock movements are logged for full auditability.',
  },
];

function SectionHeading({ badge, title, subtitle }) {
  return (
    <motion.div variants={item} className="text-center">
      {badge && (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wider text-zinc-200">
          <FaStar className="h-3 w-3 fill-amber-400" />
          {badge}
        </span>
      )}
      <h2 className="mt-6 text-3xl font-normal tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed font-light text-zinc-400 sm:text-lg">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <motion.div
      variants={item}
      className="group relative rounded-2xl p-[1px] transition-shadow duration-500 ease-out hover:shadow-xl hover:shadow-[#4514C1]/20"
    >
      <div className="absolute inset-0 rounded-2xl bg-white/5 transition-opacity duration-500 ease-out group-hover:opacity-0" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4514C1] via-[#E8522D] to-[#F59E45] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
      
      <div className="relative z-10 h-full overflow-hidden rounded-[15px] bg-zinc-900/30 p-6 transition-colors duration-500 ease-out group-hover:bg-zinc-900/60 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4514C1]/5 via-transparent to-[#E8522D]/5 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
        <span className="relative flex size-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#4514C1]/20 via-[#E8522D]/20 to-[#F59E45]/20 text-white backdrop-blur-sm transition-transform duration-500 ease-out group-hover:scale-110">
          <Icon className="h-5 w-5 fill-current" />
        </span>
        <h3 className="relative mt-5 text-lg font-medium text-white">{title}</h3>
        <p className="relative mt-2 text-sm leading-relaxed font-light text-zinc-400">{desc}</p>
      </div>
    </motion.div>
  );
}

function SolutionCard({ icon: Icon, title, desc }) {
  return (
    <motion.div
      variants={item}
      className="group relative rounded-2xl p-[1px] transition-shadow duration-500 ease-out hover:shadow-xl hover:shadow-[#E8522D]/20"
    >
      <div className="absolute inset-0 rounded-2xl bg-white/5 transition-opacity duration-500 ease-out group-hover:opacity-0" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4514C1] via-[#E8522D] to-[#F59E45] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
      
      <div className="relative z-10 h-full overflow-hidden rounded-[15px] bg-zinc-900/30 p-6 transition-colors duration-500 ease-out group-hover:bg-zinc-900/60 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8522D]/5 via-transparent to-[#F59E45]/5 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
        <span className="relative flex size-14 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#4514C1]/30 via-[#E8522D]/30 to-[#F59E45]/30 text-white backdrop-blur-sm transition-transform duration-500 ease-out group-hover:scale-110">
          <Icon className="h-6 w-6 fill-current" />
        </span>
        <h3 className="relative mt-5 text-lg font-medium text-white">{title}</h3>
        <p className="relative mt-2 text-sm leading-relaxed font-light text-zinc-400">{desc}</p>
      </div>
    </motion.div>
  );
}

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <motion.div
      variants={item}
      className="group relative rounded-2xl p-[1px] transition-shadow duration-500 ease-out hover:shadow-lg hover:shadow-[#F59E45]/10"
    >
      <div className="absolute inset-0 rounded-2xl bg-white/5 transition-opacity duration-500 ease-out group-hover:opacity-0" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4514C1] via-[#E8522D] to-[#F59E45] opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />

      <div className="relative z-10 overflow-hidden rounded-[15px] bg-zinc-900/30 transition-colors duration-500 ease-out group-hover:bg-zinc-900/50">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-medium text-zinc-200 transition-colors hover:text-white"
        >
          <span>{item.q}</span>
          <span className={`ml-4 shrink-0 transition-transform duration-500 ease-out ${isOpen ? 'rotate-45' : ''}`}>
            <FaPlus className={`h-3.5 w-3.5 fill-current ${isOpen ? 'text-[#F59E45]' : 'text-zinc-500 group-hover:text-white'}`} />
          </span>
        </button>
        {isOpen && (
          <div className="border-t border-white/5 px-6 pb-5 pt-4">
            <p className="text-sm leading-relaxed font-light text-zinc-400">{item.a}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white">
      <Hero
        logoText="StockFlow"
        navItems={[
          { label: 'Features', href: '#features' },
          { label: 'Solutions', href: '#solutions' },
          { label: 'FAQ', href: '#faq' },
        ]}
        signInText="Sign In"
        signInHref="/login"
        getStartedText="Start Free"
        getStartedHref="/register"
        badgeText="SMART INVENTORY MANAGEMENT"
        titleLine1="Take Control"
        titleLine2Start="Of Every "
        titleLine2Accent="SKU"
        description="Simplify your inventory and order management. Track your stock levels, create orders with built-in GST calculations, and gain operational visibility from a single dashboard."
        primaryCtaText="Start Free"
        primaryCtaHref="/register"
        secondaryCtaText="Explore Features"
        secondaryCtaHref="#features"
        backgroundImage={bgImage}
        socialLinks={[]}
        stats={[
          {
            value: 'Instant',
            label: 'Stock Deduction',
            icon: <FaBox className="h-4 w-4 fill-current" />,
          },
          {
            value: 'Built-in',
            label: 'GST Support',
            icon: <FaCircleCheck className="h-4 w-4 fill-current" />,
          },
          {
            value: '100%',
            label: 'Audit Trail',
            icon: <FaClockRotateLeft className="h-4 w-4 fill-current" />,
          },
        ]}
      />

      {/* Features */}
      <section id="features" className="relative overflow-hidden px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(69,20,193,0.12),transparent)]" aria-hidden />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="relative mx-auto max-w-6xl"
        >
          <SectionHeading
            badge="EVERYTHING YOU NEED"
            title="Your journey to smarter ops starts here"
            subtitle="Products, customers, orders, inventory logs, and analytics — connected and consistent in one platform."
          />
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="relative overflow-hidden px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(232,82,45,0.08),transparent)]" aria-hidden />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="relative mx-auto max-w-6xl"
        >
          <SectionHeading
            badge="BUILT FOR EVERY BUSINESS"
            title="One platform. Every moving part."
            subtitle="From retail stores to manufacturing units — StockFlow adapts to your workflow, not the other way around."
          />
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SOLUTIONS.map((s, i) => (
              <SolutionCard key={s.title} {...s} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative overflow-hidden px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(245,158,69,0.08),transparent)]" aria-hidden />
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="relative mx-auto max-w-3xl"
        >
          <SectionHeading
            badge="QUESTIONS?"
            title="Frequently asked questions"
            subtitle="Everything you need to know about StockFlow. Still have questions? We are here to help."
          />
          <div className="mt-12 space-y-3">
            {FAQS.map((faq, i) => (
              <FaqItem
                key={faq.q}
                item={faq}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(69,20,193,0.15),transparent)]" aria-hidden />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wider text-zinc-200">
            <FaCircleCheck className="h-3 w-3 fill-amber-400" />
            GET STARTED TODAY
          </span>
          <h2 className="mt-6 text-3xl font-normal tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">take control</span> of your inventory?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed font-light text-zinc-300">
            Join thousands of businesses using StockFlow to streamline operations, reduce stockouts, and grow with confidence.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-[#4514C1] via-[#E8522D] to-[#F59E45] px-8 py-3 text-sm font-medium text-white shadow-lg shadow-[#E8522D]/20 outline-2 -outline-offset-2 outline-white/20 transition-all duration-200 hover:shadow-[#E8522D]/40 hover:brightness-110"
            >
              Start Free <FaArrowRight className="ml-2 inline h-3.5 w-3.5 fill-current" />
            </Link>
            <a
              href="#features"
              className="flex items-center justify-center rounded-[12px] border border-white/10 bg-gradient-to-r from-[#4514C1] via-[#E8522D] to-[#F59E45] p-[1px]"
            >
              <div className="rounded-lg bg-black px-8 py-3 text-sm font-light text-white transition-all duration-200">
                Explore features
              </div>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 px-6 pb-8 pt-16 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Logo variant="light" to="/" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed font-light text-zinc-500">
                Modern inventory and order management for growing businesses. Track SKUs, manage orders, generate GST invoices, and make data-driven decisions — all in one place.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Product</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#features" className="text-sm font-light text-zinc-500 transition-colors hover:text-white">Features</a></li>
                <li><a href="#solutions" className="text-sm font-light text-zinc-500 transition-colors hover:text-white">Solutions</a></li>
                <li><a href="#faq" className="text-sm font-light text-zinc-500 transition-colors hover:text-white">FAQ</a></li>
                <li><Link to="/login" className="text-sm font-light text-zinc-500 transition-colors hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Company</p>
              <ul className="mt-4 space-y-3">
                <li><Link to="/register" className="text-sm font-light text-zinc-500 transition-colors hover:text-white">Get Started</Link></li>
                <li><Link to="/login" className="text-sm font-light text-zinc-500 transition-colors hover:text-white">Log In</Link></li>
                <li><span className="text-sm font-light text-zinc-600">support@stockflow.io</span></li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} StockFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
