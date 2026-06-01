import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

import Logo from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface-base p-6">
      <div className="text-center">
        <Logo variant="light" />
        <span className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/30">
          <Compass className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">404 — Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-outline">
            Home
          </Link>
          <Link to="/dashboard" className="btn-primary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
