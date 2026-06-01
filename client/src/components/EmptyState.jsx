import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = 'Once data is added, it will appear in this view.',
  action,
}) {
  return (
    <div className="card">
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
