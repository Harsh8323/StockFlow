import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  LogOut,
  UserCircle2,
  ChevronDown,
  Settings as SettingsIcon,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';
import NotificationsDropdown from './NotificationsDropdown.jsx';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-surface-base/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden text-sm text-slate-500 md:block">
          Welcome back,{' '}
          <span className="font-medium text-slate-200">
            {user?.name?.split(' ')[0] || 'there'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsDropdown />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-white/5"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-xs font-semibold text-white shadow-glow-sm">
              {initials}
            </span>
            <span className="hidden text-left text-sm sm:block">
              <span className="block font-medium text-white">{user?.name}</span>
              <span className="block text-xs capitalize text-slate-500">{user?.role}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-surface-elevated shadow-card">
              <div className="border-b border-white/10 px-3 py-2.5">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <SettingsIcon className="h-4 w-4" /> Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
