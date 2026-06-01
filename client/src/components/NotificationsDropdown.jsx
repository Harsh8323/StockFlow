import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  PackageX,
  ShoppingCart,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

import { listProducts } from '../services/productService.js';
import { listOrders } from '../services/orderService.js';
import { formatNumber } from '../utils/format.js';

/**
 * Lightweight notification feed pulled from existing endpoints — no new
 * server collection required. We combine:
 *   • Low / out-of-stock products (from /api/products?lowStock=true)
 *   • Pending orders            (from /api/orders?orderStatus=pending)
 * Refreshes every time the dropdown is opened.
 */
export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lowStock, setLowStock] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  // Cache the most recently loaded count so the badge can show without
  // forcing a refetch on every render.
  const [count, setCount] = useState(0);
  const wrapRef = useRef(null);

  // Click-away.
  useEffect(() => {
    const onClickAway = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  // Initial badge fetch on mount (counts only).
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const [lowRes, pendingRes] = await Promise.all([
          listProducts({ lowStock: true, status: 'active', limit: 1 }),
          listOrders({ orderStatus: 'pending', limit: 1 }),
        ]);
        if (cancelled) return;
        const total =
          (lowRes?.pagination?.total || 0) + (pendingRes?.pagination?.total || 0);
        setCount(total);
      } catch {
        // silent — badge just stays at 0
      }
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  // Full fetch only when the dropdown opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listProducts({
        lowStock: true,
        status: 'active',
        sortBy: 'stockQuantity',
        sortOrder: 'asc',
        limit: 5,
      }),
      listOrders({
        orderStatus: 'pending',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 5,
      }),
    ])
      .then(([lowRes, pendingRes]) => {
        if (cancelled) return;
        setLowStock(lowRes?.items || []);
        setPendingOrders(pendingRes?.items || []);
        setCount(
          (lowRes?.pagination?.total || 0) + (pendingRes?.pagination?.total || 0)
        );
      })
      .catch(() => {
        if (cancelled) return;
        setLowStock([]);
        setPendingOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const hasAny = lowStock.length > 0 || pendingOrders.length > 0;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open notifications"
        className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-surface-elevated shadow-card">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">
              Notifications
            </h3>
            <span className="text-xs text-slate-500">
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : !hasAny ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  You're all caught up
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  No pending orders or stock alerts right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingOrders.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pending orders
                    </p>
                    {pendingOrders.map((o) => (
                      <Link
                        key={o._id}
                        to={`/orders/${o._id}`}
                        onClick={() => setOpen(false)}
                        className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                          <ShoppingCart className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {o.invoiceNumber}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {o.customerSnapshot?.name || 'Customer'} · awaiting action
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {lowStock.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Stock alerts
                    </p>
                    {lowStock.map((p) => {
                      const out = (p.stockQuantity || 0) === 0;
                      return (
                        <Link
                          key={p._id}
                          to="/inventory"
                          onClick={() => setOpen(false)}
                          className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                              out
                                ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                          >
                            {out ? <PackageX className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {p.productName}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {out
                                ? 'Out of stock'
                                : `${formatNumber(p.stockQuantity)} left · reorder at ${formatNumber(p.reorderLevel)}`}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 text-xs dark:border-slate-800">
            <Link
              to="/inventory"
              onClick={() => setOpen(false)}
              className="font-medium text-brand-400 hover:text-brand-300"
            >
              Manage inventory
            </Link>
            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              className="font-medium text-brand-400 hover:text-brand-300"
            >
              View all orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
