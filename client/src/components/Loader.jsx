import { Loader2 } from 'lucide-react';

export default function Loader({ label, className = '' }) {
  return (
    <div className={`flex items-center gap-2 text-slate-500 dark:text-slate-400 ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
