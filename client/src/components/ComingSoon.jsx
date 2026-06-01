import { Construction } from 'lucide-react';
import PageHeader from './PageHeader.jsx';

export default function ComingSoon({ title, subtitle, phase }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card">
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
            <Construction className="h-7 w-7" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Coming up in {phase}
          </h2>
          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            This module is part of the StockFlow roadmap. Phase 1 ships authentication and
            the foundation; the rest of the modules are being built next.
          </p>
        </div>
      </div>
    </div>
  );
}
