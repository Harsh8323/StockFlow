import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  BarChart3,
  UserCog,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';

import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const linkClass = ({ isActive }) =>
  [
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-brand-500 text-white shadow-glow-sm'
      : 'text-slate-400 hover:bg-white/5 hover:text-white',
  ].join(' ');

export default function Sidebar({ open, onClose }) {
  const { user, hasRole } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => !item.roles || (user && hasRole(...item.roles))
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-surface-elevated p-4 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <Logo variant="light" />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClass}
              onClick={onClose}
              end={to === '/dashboard'}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto shrink-0 rounded-xl border border-white/10 bg-surface-card p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-200">StockFlow v1.0</p>
          <p className="mt-0.5 text-[11px]">
            Signed in as <span className="font-medium text-brand-400">{user?.name || '—'}</span>
          </p>
        </div>
      </aside>
    </>
  );
}
