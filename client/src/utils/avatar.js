// Avatar helpers: initials + a deterministic background color derived from
// the user's name, so placeholder avatars look intentional, not random.

// Muted, dark-friendly palette — one of these is picked per name.
const COLORS = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-fuchsia-600',
];

// First letters of the first two name parts, e.g. "Srijan Kumar" -> "SK".
export function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// Turn a stored avatar value into a loadable URL. Avatars uploaded through
// the app are stored as relative paths ("/uploads/avatars/...") served by
// the API server — they need the API origin in front. Remote URLs (https://…)
// and empty values pass through unchanged.
export function resolveAvatar(src, apiOrigin) {
  if (!src) return '';
  if (src.startsWith('/uploads/')) return `${apiOrigin}${src}`;
  return src;
}

// Deterministic pick: the same name always gets the same color.
export function avatarBg(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return COLORS[hash % COLORS.length];
}
