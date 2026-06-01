import { useEffect, useRef, useState } from 'react';
import { Search, X, UserPlus, Loader2, Phone, Mail } from 'lucide-react';

import useDebounce from '../hooks/useDebounce.js';
import { listCustomers } from '../services/customerService.js';

export default function CustomerPicker({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClickAway = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    listCustomers({
      search: debouncedQuery || undefined,
      isActive: 'true',
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    })
      .then((data) => {
        if (!cancelled) setResults(data.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to search customers');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  const handleSelect = (c) => {
    onChange?.(c);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapRef} className="relative">
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-elevated px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-300">
              {(value.name || '?')
                .split(' ')
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{value.name}</p>
              <p className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {value.phone}
                </span>
                {value.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {value.email}
                  </span>
                )}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              onClick={() => onChange?.(null)}
              aria-label="Clear customer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 bg-surface-elevated/50 px-4 py-3 text-left text-sm text-slate-400 transition hover:border-brand-500/40 hover:text-slate-300"
        >
          <UserPlus className="h-4 w-4 shrink-0 text-brand-400" />
          Select a customer for this order
        </button>
      )}

      {open && (
        <div className="dropdown-panel absolute left-0 right-0 top-full z-30 mt-2">
          <div className="border-b border-white/10 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="search"
                className="input py-2 pl-9"
                placeholder="Search by name, email, phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto overscroll-contain sm:max-h-64">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-6 text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-400" /> Searching…
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-sm text-rose-400">{error}</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                {query ? 'No matching customers.' : 'No active customers yet.'}
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {results.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(c)}
                      className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-300">
                        {(c.name || '?')
                          .split(' ')
                          .map((n) => n[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{c.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {c.phone}
                          {c.email ? ` · ${c.email}` : ''}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
