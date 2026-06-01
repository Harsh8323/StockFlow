const STYLES = {
  paid:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  partial: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  unpaid:  'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

export default function PaymentStatusPill({ status, className = '' }) {
  const cls = STYLES[status] || STYLES.unpaid;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls} ${className}`}
    >
      {status || 'unpaid'}
    </span>
  );
}
