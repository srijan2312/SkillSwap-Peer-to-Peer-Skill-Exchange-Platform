// Read-only star rating display.
export default function Stars({ value = 0, size = 'text-sm' }) {
  const rounded = Math.round(value || 0);
  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`} aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? 'text-amber-400' : 'text-slate-700'}>
          ★
        </span>
      ))}
    </span>
  );
}
