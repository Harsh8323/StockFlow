import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';

export default function Logo({ collapsed = false, variant = 'default', to = '/' }) {
  const light = variant === 'light';

  const content = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-glow-sm">
        <Boxes className="h-4 w-4" />
      </span>
      {!collapsed && (
        <span
          className={
            light
              ? 'text-lg font-bold tracking-tight text-white'
              : 'text-base font-semibold tracking-tight text-slate-900 dark:text-white'
          }
        >
          StockFlow
        </span>
      )}
    </>
  );

  if (!to) {
    return <div className="flex items-center gap-2.5">{content}</div>;
  }

  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500/50"
      aria-label="StockFlow home"
    >
      {content}
    </Link>
  );
}
