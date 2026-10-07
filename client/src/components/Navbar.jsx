import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import api from '../services/api';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`;

// Small count badge shown on the "My Swaps" link when there are incoming
// pending requests.
function PendingBadge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
      {count}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Keep the badge fresh: one cheap dashboard read whenever the user changes.
  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    let cancelled = false;
    api
      .get('/dashboard')
      .then(({ data }) => {
        if (!cancelled) setPendingCount(data?.stats?.pendingIncoming || 0);
      })
      .catch(() => {
        /* badge is best-effort — a failed read just hides it */
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-base/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight text-white">
          Skill<span className="text-violet-400">Swap</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 sm:flex">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/discover" className={linkClass}>
            Discover
          </NavLink>
          <NavLink to="/skills" className={linkClass}>
            My Skills
          </NavLink>
          <NavLink to="/swaps" className={linkClass}>
            My Swaps
            <PendingBadge count={pendingCount} />
          </NavLink>
        </div>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-card p-1 pr-3 transition-colors hover:border-white/20"
          >
            <Avatar src={user?.avatar} name={user?.name} className="h-8 w-8" textClass="text-xs" />
            <span className="max-w-[120px] truncate text-sm text-slate-300">{user?.name}</span>
          </button>

          {menuOpen && (
            <>
              {/* Invisible layer: clicking anywhere closes the menu */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-card py-1 shadow-xl">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  Edit Profile
                </Link>
                <Link
                  to={`/users/${user?._id}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  View My Profile
                </Link>
                {/* Main nav links live here too on small screens */}
                <div className="border-t border-white/10 sm:hidden">
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    Dashboard
                  </Link>
                  <Link to="/discover" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    Discover
                  </Link>
                  <Link to="/skills" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    My Skills
                  </Link>
                  <Link to="/swaps" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                    My Swaps
                    <PendingBadge count={pendingCount} />
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full border-t border-white/10 px-4 py-2 text-left text-sm text-rose-400 hover:bg-white/5"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
