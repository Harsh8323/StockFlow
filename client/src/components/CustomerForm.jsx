import { useEffect, useState } from 'react';
import { Loader2, Save, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import Modal from './Modal.jsx';
import { createCustomer, updateCustomer } from '../services/customerService.js';

const PHONE_REGEX = /^[+]?[\d\s\-()]{6,25}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
  isActive: true,
};

const toFormState = (customer) => {
  if (!customer) return { ...emptyForm };
  return {
    name: customer.name ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    address: customer.address ?? '',
    notes: customer.notes ?? '',
    isActive: customer.isActive !== false,
  };
};

export default function CustomerForm({ open, onClose, onSaved, customer }) {
  const isEdit = !!customer;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(customer));
    setErrors({});
  }, [open, customer]);

  const onField = (k) => (ev) => {
    const value =
      ev?.target?.type === 'checkbox' ? ev.target.checked : ev?.target ? ev.target.value : ev;
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Must be at least 2 characters';

    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!PHONE_REGEX.test(form.phone.trim())) e.phone = 'Invalid phone format';

    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
      e.email = 'Invalid email address';
    }

    if (form.address && form.address.length > 500) e.address = 'Must be at most 500 characters';
    if (form.notes && form.notes.length > 1000) e.notes = 'Must be at most 1000 characters';

    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      isActive: !!form.isActive,
    };

    setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateCustomer(customer._id, payload)
        : await createCustomer(payload);
      toast.success(isEdit ? 'Customer updated' : 'Customer added');
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      closeOnBackdrop={!submitting}
      title={isEdit ? 'Edit customer' : 'Add new customer'}
      description={
        isEdit
          ? `Updating ${customer?.name || 'customer'}`
          : 'Add a new customer to your contact list. Fields marked with * are required.'
      }
      size="lg"
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="modal-body">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="cf-name" className="label">Full name *</label>
            <input
              id="cf-name"
              type="text"
              autoComplete="name"
              className="input"
              value={form.name}
              onChange={onField('name')}
              disabled={submitting}
              placeholder="e.g. Priya Sharma"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="cf-phone" className="label">Phone *</label>
            <input
              id="cf-phone"
              type="tel"
              autoComplete="tel"
              className="input"
              value={form.phone}
              onChange={onField('phone')}
              disabled={submitting}
              placeholder="+91 98765 43210"
            />
            {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="cf-email" className="label">Email</label>
            <input
              id="cf-email"
              type="email"
              autoComplete="email"
              className="input"
              value={form.email}
              onChange={onField('email')}
              disabled={submitting}
              placeholder="optional"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cf-address" className="label">Address</label>
            <textarea
              id="cf-address"
              rows={2}
              className="input resize-y"
              value={form.address}
              onChange={onField('address')}
              disabled={submitting}
              placeholder="Street, city, state, postal code"
            />
            {errors.address && <p className="mt-1 text-xs text-rose-600">{errors.address}</p>}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="cf-notes" className="label">Notes</label>
            <textarea
              id="cf-notes"
              rows={3}
              className="input resize-y"
              value={form.notes}
              onChange={onField('notes')}
              disabled={submitting}
              placeholder="Internal notes — preferences, GST number, etc."
            />
            {errors.notes && <p className="mt-1 text-xs text-rose-600">{errors.notes}</p>}
          </div>

          {isEdit && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-surface-elevated text-brand-500 focus:ring-brand-500/50"
                  checked={!!form.isActive}
                  onChange={onField('isActive')}
                  disabled={submitting}
                />
                Active customer
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Inactive customers are hidden from order creation but kept for history.
              </p>
            </div>
          )}
        </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add customer
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
