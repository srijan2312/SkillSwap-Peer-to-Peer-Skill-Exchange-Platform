// One number tile for the dashboard stats row.
export default function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card p-5">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}
