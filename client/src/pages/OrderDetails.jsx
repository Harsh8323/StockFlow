import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  History,
  RefreshCw,
  Loader2,
  CircleSlash,
  Truck,
  PackageCheck,
  Settings,
  CheckCircle2,
  CreditCard,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import Select from '../components/Select.jsx';
import Loader from '../components/Loader.jsx';
import OrderStatusPill from '../components/OrderStatusPill.jsx';
import PaymentStatusPill from '../components/PaymentStatusPill.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';

import {
  getOrder,
  updateOrderStatus,
  downloadInvoice,
  STATUS_TRANSITIONS,
  FINAL_STATUSES,
  PAYMENT_STATUSES,
} from '../services/orderService.js';
import { formatCurrency, formatDate, resolveImageUrl } from '../utils/format.js';

const STATUS_ACTIONS = {
  processing: { label: 'Mark as processing', icon: Settings },
  shipped:    { label: 'Mark as shipped',    icon: Truck },
  delivered:  { label: 'Mark as delivered',  icon: PackageCheck },
  cancelled:  { label: 'Cancel order',       icon: CircleSlash, tone: 'danger' },
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pendingCancel, setPendingCancel] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownload = async () => {
    if (!order || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      await downloadInvoice(order._id, order.invoiceNumber);
      toast.success(`Downloaded ${order.invoiceNumber}.pdf`);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to download invoice');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrder(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Failed to load order');
      toast.error(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const changeStatus = async (nextStatus) => {
    try {
      const { order: updated } = await updateOrderStatus(id, { orderStatus: nextStatus });
      setOrder(updated);
      toast.success(
        nextStatus === 'cancelled'
          ? 'Order cancelled, stock restored'
          : `Order moved to ${nextStatus}`
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader label="Loading order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-rose-600">{error || 'Order not found'}</p>
          <Link to="/orders" className="btn-secondary mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const allowedNext = STATUS_TRANSITIONS[order.orderStatus] || [];
  const isFinal = FINAL_STATUSES.has(order.orderStatus);

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
        title={
          <span className="flex items-center gap-3">
            <span className="font-mono text-lg">{order.invoiceNumber}</span>
            <OrderStatusPill status={order.orderStatus} />
            <PaymentStatusPill status={order.paymentStatus} />
          </span>
        }
        subtitle={`Placed on ${fmtDateTime(order.createdAt)}${order.createdBy ? ` by ${order.createdBy.name}` : ''}`}
        actions={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchOrder}
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDownload}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{downloadingPdf ? 'Preparing…' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPaymentModalOpen(true)}
              disabled={isFinal && order.orderStatus === 'cancelled'}
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Update payment</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Items</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {order.items.map((it, idx) => (
                <div key={`${it.sku}-${idx}`} className="flex items-center gap-3 px-5 py-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {it.product?.productImage ? (
                      <img
                        src={resolveImageUrl(it.product.productImage)}
                        alt={it.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {it.productName}
                      {!it.product && (
                        <span className="ml-2 text-[10px] uppercase text-slate-400">(deleted)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{it.sku}</span> · {formatCurrency(it.unitPrice)} × {it.quantity}
                    </p>
                  </div>
                  <div className="w-28 text-right font-medium tabular-nums text-slate-800 dark:text-slate-200">
                    {formatCurrency(it.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 border-t border-slate-200 px-5 py-4 text-sm dark:border-slate-800">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST ({order.gstRate}%)</span>
                <span className="tabular-nums">{formatCurrency(order.gstAmount)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold dark:border-slate-800">
                <span className="text-slate-900 dark:text-slate-100">Total</span>
                <span className="tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Paid</span>
                <span className="tabular-nums">{formatCurrency(order.amountPaid)}</span>
              </div>
              {order.totalAmount - order.amountPaid > 0.001 && (
                <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300">
                  <span>Balance due</span>
                  <span className="tabular-nums">{formatCurrency(order.totalAmount - order.amountPaid)}</span>
                </div>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
              </div>
              <div className="card-body">
                <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{order.notes}</p>
              </div>
            </div>
          )}

          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Status timeline
                </h2>
                <History className="h-4 w-4 text-slate-400" />
              </div>
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                <li className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-700 dark:text-slate-300">
                      Order created as <OrderStatusPill status="pending" className="ml-1" />
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {fmtDateTime(order.createdAt)} · by {order.createdBy?.name || 'unknown'}
                    </p>
                  </div>
                </li>
                {order.statusHistory.map((h, idx) => (
                  <li key={idx} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                      <History className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-700 dark:text-slate-300">
                        <OrderStatusPill status={h.from} className="mx-1" />→
                        <OrderStatusPill status={h.to} className="mx-1" />
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {fmtDateTime(h.changedAt)} · by {h.changedBy?.name || 'unknown'}
                        {h.notes ? ` · ${h.notes}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Customer</h2>
              {order.customer && (
                <Link
                  to={`/customers`}
                  className="text-xs text-brand-600 hover:underline dark:text-brand-300"
                >
                  View all
                </Link>
              )}
            </div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {order.customerSnapshot?.name}
                </span>
              </div>
              {order.customerSnapshot?.phone && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${order.customerSnapshot.phone}`} className="hover:text-brand-600">
                    {order.customerSnapshot.phone}
                  </a>
                </div>
              )}
              {order.customerSnapshot?.email && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${order.customerSnapshot.email}`} className="hover:text-brand-600">
                    {order.customerSnapshot.email}
                  </a>
                </div>
              )}
              {order.customerSnapshot?.address && (
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="text-xs">{order.customerSnapshot.address}</span>
                </div>
              )}
            </div>
          </div>

          {!isFinal && allowedNext.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Actions</h2>
              </div>
              <div className="card-body space-y-2">
                {allowedNext.map((next) => {
                  const meta = STATUS_ACTIONS[next];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const danger = meta.tone === 'danger';
                  return (
                    <button
                      key={next}
                      type="button"
                      onClick={() => {
                        if (danger) setPendingCancel(true);
                        else changeStatus(next);
                      }}
                      className={`w-full ${
                        danger
                          ? 'btn bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/40'
                          : 'btn-secondary'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {meta.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => navigate('/orders/new')}
                  className="w-full btn-primary"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Create another order
                </button>
              </div>
            </div>
          )}

          {isFinal && (
            <div className="card">
              <div className="card-body text-sm text-slate-600 dark:text-slate-400">
                This order is <span className="font-medium capitalize">{order.orderStatus}</span> — no
                further status changes can be made.
                {order.orderStatus === 'cancelled' && order.cancelledAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    Cancelled on {fmtDateTime(order.cancelledAt)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingCancel}
        onClose={() => setPendingCancel(false)}
        onConfirm={async () => {
          await changeStatus('cancelled');
          setPendingCancel(false);
        }}
        title="Cancel this order?"
        description={`Cancelling will restore ${order.items.length} item${
          order.items.length > 1 ? 's' : ''
        } back to inventory and adjust ${order.customerSnapshot?.name || 'the customer'}'s totals.`}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        order={order}
        onUpdated={(o) => setOrder(o)}
      />
    </div>
  );
}

function PaymentModal({ open, onClose, order, onUpdated }) {
  const [status, setStatus] = useState(order.paymentStatus);
  const [amount, setAmount] = useState(order.amountPaid);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus(order.paymentStatus);
    setAmount(order.amountPaid);
  }, [open, order]);

  const onSave = async () => {
    setSubmitting(true);
    try {
      const cappedAmount = Math.min(Math.max(0, Number(amount) || 0), order.totalAmount);
      const payload = {
        paymentStatus: status,
        amountPaid:
          status === 'paid'
            ? order.totalAmount
            : status === 'unpaid'
            ? 0
            : cappedAmount,
      };
      const { order: updated } = await updateOrderStatus(order._id, payload);
      onUpdated?.(updated);
      toast.success('Payment updated');
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Failed to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      closeOnBackdrop={!submitting}
      title="Update payment"
      description="Adjust the payment status and recorded amount for this order."
      size="sm"
    >
      <div className="space-y-4 px-5 py-5">
        <div>
          <label htmlFor="pm-status" className="label">Payment status</label>
          <Select
            id="pm-status"
            className="capitalize"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
        </div>
        {status === 'partial' && (
          <div>
            <label htmlFor="pm-amount" className="label">Amount paid</label>
            <input
              id="pm-amount"
              type="number"
              min={0}
              max={order.totalAmount}
              step="0.01"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Of total {formatCurrency(order.totalAmount)}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={onSave} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </Modal>
  );
}
