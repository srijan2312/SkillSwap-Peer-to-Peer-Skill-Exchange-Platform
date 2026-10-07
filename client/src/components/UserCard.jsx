import { Link } from 'react-router-dom';
import SkillTag from './SkillTag';
import Stars from './Stars';
import Avatar from './Avatar';

// One card for a recommended skill partner. Used on Discover and Dashboard.
//
// Expects a "match item" from the API:
// { user, score (0-100), strength ('2-way match' | '1-way match'),
//   skillsYouCanLearn: [names], skillsTheyCanLearn: [names] }
export default function UserCard({ match, onSwap }) {
  const { user, score, strength } = match;
  const skillsYouCanLearn = match.skillsYouCanLearn || [];
  const skillsTheyCanLearn = match.skillsTheyCanLearn || [];
  const isTwoWay = strength === '2-way match';

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-card p-5 transition-colors hover:border-white/20">
      <div className="flex items-start gap-4">
        <Avatar src={user.avatar} name={user.name} className="h-12 w-12" textClass="text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/users/${user._id}`}
              className="truncate font-semibold text-white hover:text-violet-300"
            >
              {user.name}
            </Link>
            {typeof score === 'number' && (
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  isTwoWay
                    ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                }`}
              >
                {score}% · {strength}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <Stars value={user.rating} />
            <span>({user.ratingCount || 0})</span>
            {user.availability && <span>· {user.availability}</span>}
          </div>
        </div>
      </div>

      {user.bio && <p className="mt-3 line-clamp-2 text-sm text-slate-400">{user.bio}</p>}

      <div className="mt-3 space-y-2">
        {skillsYouCanLearn.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500">Teaches you:</span>
            {skillsYouCanLearn.slice(0, 4).map((name) => (
              <SkillTag key={name} name={name} tone="teach" />
            ))}
          </div>
        )}
        {skillsTheyCanLearn.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500">Learns from you:</span>
            {skillsTheyCanLearn.slice(0, 4).map((name) => (
              <SkillTag key={name} name={name} tone="learn" />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 pt-1">
        <Link
          to={`/users/${user._id}`}
          className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-center text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:text-white"
        >
          View Profile
        </Link>
        <button
          onClick={() => onSwap(match)}
          className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          Swap Skills
        </button>
      </div>
    </div>
  );
}
