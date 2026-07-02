import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';

export default function Logo({ collapsed = false, variant = 'default', to = '/' }) {
  const light = variant === 'light';

  const content = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#4514C1] via-[#E8522D] to-[#F59E45] text-white shadow-lg shadow-amber-600/20">
        <Boxes className="h-5 w-5" />
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
