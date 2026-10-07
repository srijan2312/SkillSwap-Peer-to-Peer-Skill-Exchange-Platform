// Friendly placeholder for empty lists and failed loads.
import { Link } from 'react-router-dom';

export default function EmptyState({ title, hint, actionLabel, actionTo }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
