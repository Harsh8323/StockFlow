import Logo from './Logo.jsx';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="dark flex min-h-screen flex-col lg:flex-row bg-slate-950 text-white">
      <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-10 lg:w-1/2 lg:flex-none lg:border-r lg:border-white/10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo variant="light" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-zinc-500">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden bg-slate-900 lg:block">
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="800" height="800" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#4514C1]/20 via-transparent to-[#E8522D]/20" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        <div className="relative z-20 flex h-full flex-col justify-end p-12">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-amber-800/50 bg-amber-950/40 px-4 py-1.5 text-xs font-medium tracking-wider text-amber-400">
            ★ SMART INVENTORY MANAGEMENT
          </span>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Take Control Of Every <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">SKU</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-300">
            Simplify your inventory and order management. Track your stock levels, create orders with built-in GST calculations, and gain operational visibility.
          </p>
        </div>
      </div>
    </div>
  );
}
