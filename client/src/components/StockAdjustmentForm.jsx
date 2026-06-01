import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Package, ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react';

import Modal from './Modal.jsx';
import Select from './Select.jsx';
import ProductPicker from './ProductPicker.jsx';
import { createStockAdjustment, MANUAL_REASONS, REASON_LABELS } from '../services/inventoryService.js';
import { formatNumber, resolveImageUrl } from '../utils/format.js';

const initialState = {
  product: null,
  direction: 'in',
  quantity: '',
  reason: 'restock',
  notes: '',
};

export default function StockAdjustmentForm({ open, onClose, onSaved }) {
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setState(initialState);
      setErrors({});
    }
  }, [open]);

  const stock = state.product?.stockQuantity ?? 0;
  const qtyNum = Number(state.quantity);
  const isOut = state.direction === 'out';

  // Default reason flips based on direction so the form reads naturally.
  useEffect(() => {
    setState((s) => {
      if (s.direction === 'in' && (s.reason === 'damage')) return s; // already valid
      if (s.direction === 'out' && (s.reason === 'restock' || s.reason === 'return')) {
        return { ...s, reason: 'damage' };
      }
      if (s.direction === 'in' && s.reason === 'damage') {
        return { ...s, reason: 'restock' };
      }
      return s;
    });
  }, [state.direction]);

  const stockAfter = useMemo(() => {
    if (!state.product || !Number.isFinite(qtyNum) || qtyNum <= 0) return null;
    return isOut ? stock - qtyNum : stock + qtyNum;
  }, [state.product, qtyNum, isOut, stock]);

  const validate = () => {
    const errs = {};
    if (!state.product) errs.product = 'Pick a product';
    if (!Number.isFinite(qtyNum) || qtyNum < 1 || !Number.isInteger(qtyNum)) {
      errs.quantity = 'Enter a positive whole number';
    } else if (isOut && qtyNum > stock) {
      errs.quantity = `Cannot remove more than the current stock (${stock})`;
    }
    if (!MANUAL_REASONS.includes(state.reason)) errs.reason = 'Select a reason';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await createStockAdjustment({
        product: state.product._id,
        direction: state.direction,
        quantity: qtyNum,
        reason: state.reason,
        notes: state.notes.trim() || undefined,
      });
      toast.success(
        isOut
          ? `Removed ${qtyNum} ${qtyNum === 1 ? 'unit' : 'units'} from ${state.product.productName}`
          : `Added ${qtyNum} ${qtyNum === 1 ? 'unit' : 'units'} to ${state.product.productName}`
      );
      onSaved?.();
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to adjust stock';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose?.()}
      title="Adjust stock"
      description="Manually record an inventory movement. All adjustments are audit-logged."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
        {/* Product picker / selected product */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Product <span className="text-rose-600">*</span>
          </label>

          {state.product ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  {state.product.productImage ? (
                    <img
                      src={resolveImageUrl(state.product.productImage)}
                      alt={state.product.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {state.product.productName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{state.product.sku}</span> · {formatNumber(stock)} in stock
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, product: null }))}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3 w-3" /> Change
              </button>
            </div>
          ) : (
            <ProductPicker
              disableOutOfStock={false}
              onAdd={(p) => setState((s) => ({ ...s, product: p }))}
              placeholder="Search products to adjust..."
            />
          )}
          {errors.product && (
            <p className="mt-1 text-xs text-rose-600">{errors.product}</p>
          )}
        </div>

        {/* Direction */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Movement <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, direction: 'in' }))}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                !isOut
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-200'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" /> Add stock
            </button>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, direction: 'out' }))}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                isOut
                  ? 'border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-900/30 dark:text-rose-200'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" /> Remove stock
            </button>
          </div>
        </div>

        {/* Quantity & Reason */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Quantity <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="input"
              value={state.quantity}
              onChange={(e) => setState((s) => ({ ...s, quantity: e.target.value }))}
              placeholder="0"
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Reason <span className="text-rose-600">*</span>
            </label>
            <Select
              value={state.reason}
              onChange={(e) => setState((s) => ({ ...s, reason: e.target.value }))}
            >
              {MANUAL_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REASON_LABELS[r]}
                </option>
              ))}
            </Select>
            {errors.reason && (
              <p className="mt-1 text-xs text-rose-600">{errors.reason}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Notes <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            className="input min-h-[72px]"
            rows={2}
            maxLength={500}
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
            placeholder="e.g. Supplier delivery — PO-1023"
          />
        </div>

        {/* Preview */}
        {state.product && stockAfter !== null && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">New stock level</span>
              <span className="tabular-nums font-medium text-slate-900 dark:text-slate-100">
                {formatNumber(stock)} →{' '}
                <span className={stockAfter < (state.product.reorderLevel || 0) ? 'text-amber-600 dark:text-amber-400' : ''}>
                  {formatNumber(stockAfter)}
                </span>
              </span>
            </div>
            {stockAfter < (state.product.reorderLevel || 0) && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Will fall below reorder level ({formatNumber(state.product.reorderLevel)}).
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Saving…' : 'Save adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
