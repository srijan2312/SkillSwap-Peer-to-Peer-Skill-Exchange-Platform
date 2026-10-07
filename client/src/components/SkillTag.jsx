// Small pill for a skill name.
// tone="teach" (violet) = a skill someone offers; tone="learn" (blue) = wanted.
export default function SkillTag({ name, tone = 'teach' }) {
  const styles =
    tone === 'teach'
      ? 'border-violet-500/20 bg-violet-500/10 text-violet-300'
      : 'border-blue-500/20 bg-blue-500/10 text-blue-300';
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {name}
    </span>
  );
}
