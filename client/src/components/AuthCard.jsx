import Logo from './Logo.jsx';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-surface-base lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo variant="light" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-slate-500">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-surface-elevated lg:block">
        <div className="absolute inset-0 bg-hero-glow" aria-hidden />
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="800" height="800" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative flex h-full flex-col justify-end p-12">
          <span className="mb-6 inline-flex w-fit rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-300">
            Inventory made simple
          </span>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Centralize inventory, orders, and customers in one place.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            StockFlow helps small businesses replace messy spreadsheets with real software —
            stock tracking, invoices, and analytics that just work.
          </p>
        </div>
      </div>
    </div>
  );
}
