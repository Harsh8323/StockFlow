import { useEffect, useState } from 'react';
import { Loader2, Save, Plus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import Modal from './Modal.jsx';
import Select from './Select.jsx';
import { createUser, updateUser, USER_ROLES } from '../services/userService.js';
import { useAuth } from '../context/AuthContext.jsx';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'staff',
  isActive: true,
};

const toFormState = (user) => {
  if (!user) return { ...emptyForm };
  return {
    name: user.name ?? '',
    email: user.email ?? '',
    password: '',
    confirmPassword: '',
    role: user.role ?? 'staff',
    isActive: user.isActive !== false,
  };
};

export default function UserForm({ open, onClose, onSaved, user }) {
  const { user: currentUser } = useAuth();
  const isEdit = !!user;
  const selfId = currentUser?._id || currentUser?.id;
  const isSelf = isEdit && selfId && String(selfId) === String(user._id);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(user));
    setErrors({});
    setShowPassword(false);
  }, [open, user]);

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

    if (!form.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) e.email = 'Invalid email address';

    if (!isEdit) {
      if (!form.password) e.password = 'Password is required';
      else if (form.password.length < 6) e.password = 'Must be at least 6 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    } else if (form.password) {
      if (form.password.length < 6) e.password = 'Must be at least 6 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }

    if (!USER_ROLES.includes(form.role)) e.role = 'Select a valid role';

    return e;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    setSubmitting(true);
    try {
      let saved;
      if (isEdit) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          isActive: !!form.isActive,
        };
        if (form.password.trim()) payload.password = form.password;
        saved = await updateUser(user._id, payload);
        toast.success('User updated');
      } else {
        saved = await createUser({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          isActive: !!form.isActive,
        });
        toast.success('User created');
      }
      onSaved?.(saved);
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose?.()}
      title={isEdit ? 'Edit user' : 'Add user'}
      description={
        isEdit
          ? 'Update account details. Leave password blank to keep the current one.'
          : 'Create a new admin or staff account.'
      }
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
        <div>
          <label className="label">
            Full name <span className="text-rose-600">*</span>
          </label>
          <input type="text" className="input" value={form.name} onChange={onField('name')} />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>

        <div>
          <label className="label">
            Email <span className="text-rose-600">*</span>
          </label>
          <input type="email" className="input" value={form.email} onChange={onField('email')} />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label">
            Role <span className="text-rose-600">*</span>
          </label>
          <Select value={form.role} onChange={onField('role')} disabled={isSelf}>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </Select>
          {isSelf && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You cannot change your own role.
            </p>
          )}
          {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role}</p>}
        </div>

        <div>
          <label className="label">
            {isEdit ? 'New password' : 'Password'}{' '}
            {!isEdit && <span className="text-rose-600">*</span>}
            {isEdit && <span className="text-slate-400">(optional)</span>}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              value={form.password}
              onChange={onField('password')}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
        </div>

        {(form.password || !isEdit) && (
          <div>
            <label className="label">
              Confirm password {!isEdit && <span className="text-rose-600">*</span>}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input"
              value={form.confirmPassword}
              onChange={onField('confirmPassword')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
            )}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={form.isActive}
            onChange={onField('isActive')}
            disabled={isSelf}
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Active account</span>
        </label>
        {isSelf && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You cannot deactivate your own account.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
