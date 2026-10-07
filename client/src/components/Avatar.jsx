import { useEffect, useState } from 'react';
import { initials, avatarBg, resolveAvatar } from '../utils/avatar';
import { API_ORIGIN } from '../services/api';

// Avatar with a graceful fallback: if there is no avatar URL, or the image
// fails to load (broken link), we render a colored initials badge instead —
// so the UI never shows a broken-image icon.
//
// Props:
// - src:       avatar value from the API — a remote URL, a local
//              "/uploads/…" path (resolved against the API origin), or empty
// - name:      user's name (drives the initials + background color)
// - className: size classes, e.g. "h-12 w-12" (rounded-full is applied here)
// - textClass: font-size classes for the initials, e.g. "text-sm"
export default function Avatar({ src, name, className = 'h-10 w-10', textClass = 'text-sm' }) {
  const [failed, setFailed] = useState(false);
  const url = resolveAvatar(src, API_ORIGIN);

  // If an image failed to load once (e.g. a deleted upload), don't stay stuck
  // on initials forever — retry whenever the source changes, so a newly
  // uploaded picture appears immediately without needing a re-login.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!url || failed) {
    return (
      <span
        className={`flex ${className} shrink-0 items-center justify-center rounded-full font-bold text-white ${textClass} ${avatarBg(name)}`}
        aria-label={name}
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  );
}
