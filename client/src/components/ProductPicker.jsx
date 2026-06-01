import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, Package, AlertTriangle } from 'lucide-react';

import useDebounce from '../hooks/useDebounce.js';
import { listProducts } from '../services/productService.js';
import { formatCurrency, formatNumber, resolveImageUrl } from '../utils/format.js';

export default function ProductPicker({
  onAdd,
  addedIds = new Set(),
  disableOutOfStock = true,
  addedLabel = 'Added',
  placeholder = 'Search products by name, SKU, category...',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    listProducts({
      search: debouncedQuery || undefined,
      status: 'active',
      limit: 10,
      sortBy: 'productName',
      sortOrder: 'asc',
    })
      .then((data) => {
        if (!cancelled) setResults(data.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to search products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  const handleAdd = (p) => {
    onAdd?.(p);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          className="input pl-9"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="dropdown-panel absolute left-0 right-0 top-full z-30 mt-2">
          <div className="max-h-56 overflow-y-auto overscroll-contain sm:max-h-72">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-6 text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-400" /> Searching…
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-center text-sm text-rose-400">{error}</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                {query ? 'No matching products.' : 'No active products yet.'}
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {results.map((p) => {
                  const alreadyAdded = addedIds.has(p._id);
                  const outOfStock = (p.stockQuantity || 0) <= 0;
                  const blockedForStock = disableOutOfStock && outOfStock;
                  return (
                    <li key={p._id}>
                      <button
                        type="button"
                        disabled={alreadyAdded || blockedForStock}
                        onClick={() => handleAdd(p)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-elevated ring-1 ring-white/10">
                          {p.productImage ? (
                            <img
                              src={resolveImageUrl(p.productImage)}
                              alt={p.productName}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{p.productName}</p>
                          <p className="text-xs text-slate-400">
                            <span className="font-mono">{p.sku}</span> · {p.category} ·{' '}
                            <span className="tabular-nums">{formatCurrency(p.price)}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          {alreadyAdded ? (
                            <span className="badge bg-white/10 text-slate-300">{addedLabel}</span>
                          ) : (
                            <>
                              <p className="text-xs tabular-nums text-slate-400">
                                {formatNumber(p.stockQuantity)} in stock
                              </p>
                              {outOfStock ? (
                                <p className="mt-0.5 text-[10px] text-rose-400">Out of stock</p>
                              ) : p.isLowStock ? (
                                <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-amber-400">
                                  <AlertTriangle className="h-3 w-3" /> Low
                                </p>
                              ) : null}
                            </>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
