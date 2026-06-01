const STYLES = {
  pending:    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  processing: 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200',
  shipped:    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  delivered:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  cancelled:  'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};

export default function OrderStatusPill({ status, className = '' }) {
  const cls = STYLES[status] || 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls} ${className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status || 'unknown'}
    </span>
  );
}
