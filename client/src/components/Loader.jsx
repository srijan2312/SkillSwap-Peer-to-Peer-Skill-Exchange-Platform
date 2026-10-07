// Simple centered spinner. No animation libraries needed.
export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
