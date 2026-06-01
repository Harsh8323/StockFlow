import { useEffect, useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  UserRound,
  Mail,
  Calendar,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { changePassword, updateProfile } from '../services/authService.js';

const fmtDate = (iso) => {
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

export default function Settings() {
  const { user, logout, setToken, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
  }, [user?.name, user?.email]);

  if (!user) return null;

  const profileDirty = name.trim() !== user.name || email.trim() !== user.email;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }
    setProfileErrors(errs);
    if (Object.keys(errs).length || !profileDirty || profileSaving) return;

    setProfileSaving(true);
    try {
      const { user: updated } = await updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileReset = () => {
    setName(user.name);
    setEmail(user.email);
    setProfileErrors({});
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!currentPassword) errs.current = 'Enter your current password';
    if (newPassword.length < 6) errs.new = 'New password must be at least 6 characters';
    if (newPassword === currentPassword && newPassword) {
      errs.new = 'New password must be different from your current one';
    }
    if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match';
    setPasswordErrors(errs);
    if (Object.keys(errs).length || passwordSubmitting) return;

    setPasswordSubmitting(true);
    try {
      const { token, user: updated } = await changePassword({
        currentPassword,
        newPassword,
      });
      if (token) setToken(token);
      if (updated) updateUser(updated);
      toast.success('Password updated successfully');
      resetPasswordForm();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to update password';
      toast.error(msg);
      if (/current password is incorrect/i.test(msg)) {
        setPasswordErrors({ current: msg });
      }
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, account details, and password."
        actions={
          <button type="button" className="btn-secondary" onClick={() => logout()}>
            Sign out
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <div className="card-body flex flex-col items-center text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-600 text-2xl font-semibold text-white">
              {initials}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
            <span className={`mt-3 ${user.role === 'admin' ? 'badge-brand' : 'badge-emerald'} capitalize`}>
              {user.role}
            </span>
            <dl className="mt-6 w-full space-y-1 text-left text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {fmtDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Last updated {fmtDate(user.updatedAt)}</span>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold text-white">Profile</h2>
              <span className="text-xs text-slate-400">Update your name and email</span>
            </div>
            <form onSubmit={handleProfileSubmit} className="card-body space-y-4">
              <div>
                <label className="label">
                  Full name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    className="input pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                {profileErrors.name && (
                  <p className="mt-1 text-xs text-rose-500">{profileErrors.name}</p>
                )}
              </div>

              <div>
                <label className="label">
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    className="input pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {profileErrors.email && (
                  <p className="mt-1 text-xs text-rose-500">{profileErrors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Your role{' '}
                  <span className="font-medium capitalize text-slate-300">{user.role}</span> is set by
                  your admin.
                </p>
                <div className="flex items-center gap-2 sm:justify-end">
                  {profileDirty && (
                    <button
                      type="button"
                      onClick={handleProfileReset}
                      disabled={profileSaving}
                      className="btn-secondary"
                    >
                      Discard
                    </button>
                  )}
                  <button type="submit" disabled={!profileDirty || profileSaving} className="btn-primary">
                    {profileSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {profileSaving ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <h2 className="text-base font-semibold text-white">Password</h2>
              </div>
              <span className="text-xs text-slate-400">Change your sign-in password</span>
            </div>
            <form onSubmit={handlePasswordSubmit} className="card-body space-y-4">
              <div>
                <label className="label">
                  Current password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="input pr-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.current && (
                  <p className="mt-1 text-xs text-rose-500">{passwordErrors.current}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    New password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="input pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.new && (
                    <p className="mt-1 text-xs text-rose-500">{passwordErrors.new}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">Minimum 6 characters.</p>
                </div>
                <div>
                  <label className="label">
                    Confirm new password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {passwordErrors.confirm && (
                    <p className="mt-1 text-xs text-rose-500">{passwordErrors.confirm}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={resetPasswordForm}
                  disabled={passwordSubmitting}
                  className="btn-secondary"
                >
                  Clear
                </button>
                <button type="submit" disabled={passwordSubmitting} className="btn-primary">
                  {passwordSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {passwordSubmitting ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
