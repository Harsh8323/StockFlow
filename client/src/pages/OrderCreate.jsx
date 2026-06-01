import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Loader2,
  Package,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import CustomerPicker from '../components/CustomerPicker.jsx';
import ProductPicker from '../components/ProductPicker.jsx';
import { createOrder } from '../services/orderService.js';
import Select from '../components/Select.jsx';
import { formatCurrency, resolveImageUrl } from '../utils/format.js';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export default function OrderCreate() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [items, setItems] = useState([]); // { product, quantity }
  const [gstRate, setGstRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addedIds = useMemo(() => new Set(items.map((i) => i.product._id)), [items]);

  const onAdd = (product) => {
    if (addedIds.has(product._id)) return;
    setItems((arr) => [...arr, { product, quantity: 1 }]);
  };

  const onQty = (idx, delta) => {
    setItems((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it;
        const max = it.product.stockQuantity || 0;
        const next = Math.max(1, Math.min(max, it.quantity + delta));
        return { ...it, quantity: next };
      })
    );
  };

  const onQtyInput = (idx, value) => {
    setItems((arr) =>
      arr.map((it, i) => {
        if (i !== idx) return it;
        const max = it.product.stockQuantity || 0;
        const n = Math.floor(Number(value));
        if (!Number.isFinite(n) || n < 1) return it;
        return { ...it, quantity: Math.min(n, max) };
      })
    );
  };

  const onRemove = (idx) => {
    setItems((arr) => arr.filter((_, i) => i !== idx));
  };

  // Live totals (display only — server is the source of truth)
  const subtotal = useMemo(
    () => round2(items.reduce((s, it) => s + it.product.price * it.quantity, 0)),
    [items]
  );
  const gstAmount = useMemo(() => round2(subtotal * (Number(gstRate) || 0) / 100), [subtotal, gstRate]);
  const cappedDiscount = useMemo(
    () => Math.min(Math.max(0, Number(discount) || 0), round2(subtotal + gstAmount)),
    [discount, subtotal, gstAmount]
  );
  const total = useMemo(
    () => Math.max(0, round2(subtotal + gstAmount - cappedDiscount)),
    [subtotal, gstAmount, cappedDiscount]
  );

  const canSubmit = !!customer && items.length > 0 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const order = await createOrder({
        customer: customer._id,
        items: items.map((it) => ({
          product: it.product._id,
          quantity: it.quantity,
        })),
        gstRate: Number(gstRate) || 0,
        discount: Number(discount) || 0,
        amountPaid: paymentStatus === 'paid'
          ? total
          : paymentStatus === 'partial'
          ? Math.min(Math.max(0, Number(amountPaid) || 0), total)
          : 0,
        notes: notes.trim(),
      });
      toast.success(`Order ${order.invoiceNumber} created`);
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </div>

      <PageHeader
        title="Create order"
        subtitle="Select a customer, add products, and review totals. Stock is deducted on submit."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Customer */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-white">Customer</h2>
              {customer && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {customer.totalOrders ?? 0} previous orders
                </span>
              )}
            </div>
            <div className="card-body">
              <CustomerPicker value={customer} onChange={setCustomer} disabled={submitting} />
            </div>
          </div>

          {/* Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-white">Items</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {items.length === 0 ? 'No items added' : `${items.length} item${items.length > 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="card-body space-y-4">
              <ProductPicker onAdd={onAdd} addedIds={addedIds} />

              {items.length === 0 ? (
                <div className="empty-state-box py-5">
                  <Package className="mb-1.5 h-6 w-6 text-brand-400/80" />
                  Search and add products above.
                </div>
              ) : (
                <ul className="max-h-[min(50vh,24rem)] divide-y divide-white/10 overflow-y-auto overscroll-contain">
                  {items.map((it, idx) => {
                    const lineTotal = round2(it.product.price * it.quantity);
                    const stock = it.product.stockQuantity || 0;
                    return (
                      <li key={it.product._id} className="flex items-center gap-3 py-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                          {it.product.productImage ? (
                            <img
                              src={resolveImageUrl(it.product.productImage)}
                              alt={it.product.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {it.product.productName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{it.product.sku}</span> ·{' '}
                            {formatCurrency(it.product.price)} ea · {stock} in stock
                          </p>
                        </div>

                        <div className="flex items-center gap-1 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                          <button
                            type="button"
                            className="rounded-l-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            onClick={() => onQty(idx, -1)}
                            disabled={submitting || it.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={stock}
                            className="w-12 border-0 bg-transparent px-1 py-1 text-center text-sm tabular-nums focus:outline-none"
                            value={it.quantity}
                            onChange={(e) => onQtyInput(idx, e.target.value)}
                            disabled={submitting}
                          />
                          <button
                            type="button"
                            className="rounded-r-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            onClick={() => onQty(idx, +1)}
                            disabled={submitting || it.quantity >= stock}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="w-24 text-right font-medium tabular-nums text-slate-800 dark:text-slate-200">
                          {formatCurrency(lineTotal)}
                        </div>

                        <button
                          type="button"
                          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                          onClick={() => onRemove(idx)}
                          disabled={submitting}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
              <span className="text-xs text-slate-400">Optional</span>
            </div>
            <div className="card-body">
              <textarea
                rows={3}
                className="input resize-y"
                placeholder="Internal notes — delivery instructions, references, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="card lg:sticky lg:top-20">
            <div className="card-header">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </div>

            <div className="card-body space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
                  <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(subtotal)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    GST
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      className="input h-7 w-16 px-2 py-0.5 text-xs"
                      value={gstRate}
                      onChange={(e) => setGstRate(e.target.value)}
                      disabled={submitting}
                    />
                    <span className="text-xs">%</span>
                  </dt>
                  <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(gstAmount)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    Discount
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="input h-7 w-24 px-2 py-0.5 text-xs"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      disabled={submitting}
                    />
                  </dt>
                  <dd className="tabular-nums text-slate-800 dark:text-slate-200">
                    −{formatCurrency(cappedDiscount)}
                  </dd>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold dark:border-slate-800">
                  <dt className="text-slate-900 dark:text-slate-100">Total</dt>
                  <dd className="tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(total)}
                  </dd>
                </div>
              </dl>

              <div>
                <label htmlFor="op-payment" className="label">Payment</label>
                <Select
                  id="op-payment"
                  className="capitalize"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  disabled={submitting}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid in full</option>
                </Select>
                {paymentStatus === 'partial' && (
                  <div className="mt-2">
                    <label htmlFor="op-paid" className="label text-xs">Amount paid</label>
                    <input
                      id="op-paid"
                      type="number"
                      min={0}
                      max={total}
                      step="0.01"
                      className="input"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onSubmit}
                className="btn-primary w-full"
                disabled={!canSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Create order
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stock will be deducted automatically. You can cancel the order later to restore it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
