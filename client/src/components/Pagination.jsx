import { ChevronLeft, ChevronRight } from 'lucide-react';

import Select from './Select.jsx';

export default function Pagination({ pagination, onPageChange, onLimitChange }) {
  if (!pagination) return null;
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-stretch justify-between gap-3 border-t border-white/10 px-5 py-3 text-sm text-slate-400 sm:flex-row sm:items-center">
      <div>
        Showing <span className="font-medium text-slate-200">{start}</span>–
        <span className="font-medium text-slate-200">{end}</span> of{' '}
        <span className="font-medium text-slate-200">{total}</span>
      </div>

      <div className="flex items-center gap-2">
        {onLimitChange && (
          <label className="hidden items-center gap-2 sm:flex">
            <span className="text-xs uppercase tracking-wide text-slate-500">Per page</span>
            <Select
              wrapperClassName="w-[4.75rem] shrink-0"
              className="py-1.5 text-sm"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </label>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-secondary h-8 px-2 py-1"
            disabled={!hasPrev}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary h-8 px-2 py-1"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
