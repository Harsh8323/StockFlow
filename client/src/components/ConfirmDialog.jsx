import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import Modal from './Modal.jsx';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  const confirmClass =
    tone === 'danger'
      ? 'btn bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500'
      : 'btn-primary';

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} size="sm" closeOnBackdrop={!busy}>
      <div className="modal-body text-center sm:text-left">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-500/15 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </button>
        <button type="button" className={confirmClass} onClick={handleConfirm} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Working...
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  );
}
