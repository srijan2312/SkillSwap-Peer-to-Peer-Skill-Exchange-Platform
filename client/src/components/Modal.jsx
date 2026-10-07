import { useEffect } from 'react';

// Simple dialog shell: overlay click or Escape closes it.
// The swap-request and review forms are passed in as children.
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-white/10 bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="truncate text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
