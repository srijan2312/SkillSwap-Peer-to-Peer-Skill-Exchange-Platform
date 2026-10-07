import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserCard from '../components/UserCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import SwapRequestForm from '../components/SwapRequestForm';
import { useSwapRequest } from '../hooks/useSwapRequest';

const MATCH_LIMIT = 50;
// Matches are re-fetched this often so the page feels live when another
// member adds or requests a skill — short polling, not WebSockets: simple,
// stateless, and easy to explain in an interview. (WebSockets are listed as
// a future improvement in the README.)
const POLL_INTERVAL_MS = 10_000;

export default function Discover() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);
  // Fresh skill count straight from the database (not the login-time auth
  // state, which can be stale): drives the "add skills" empty-state hint.
  const [dbSkillCount, setDbSkillCount] = useState(null);

  // `searchInput` is what the user types; `search` is the debounced value we
  // actually filter on, so we don't re-filter on every keystroke.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');

  const swap = useSwapRequest(user?._id);

  // One fetch of the ranked matches. `initial` controls the full-page
  // loader; background refreshes are silent so polling never flashes the UI.
  const fetchMatches = useCallback(
    async (initial = false) => {
      if (initial) setLoading(true);
      else setRefreshing(true);
      try {
        const [matchRes, skillRes] = await Promise.all([
          api.get(`/matches?limit=${MATCH_LIMIT}`),
          api.get('/skills'),
        ]);
        setMatches(Array.isArray(matchRes.data) ? matchRes.data : []);
        const cats = [...new Set((skillRes.data || []).map((s) => s.category).filter(Boolean))].sort();
        setCategories(cats);
        setLastUpdated(new Date());
        setError('');
      } catch (err) {
        // Background polls fail silently (the last good list stays visible);
        // only the first load shows an error state.
        if (initial) setError(apiErrorMessage(err, 'Could not load skill partners.'));
      } finally {
        if (initial) setLoading(false);
        else setRefreshing(false);
      }
    },
    []
  );

  // Initial load + short polling every 10s. The interval is cleared when the
  // page unmounts, so polling stays scoped to Discover only.
  useEffect(() => {
    let cancelled = false;
    fetchMatches(true);
    pollRef.current = setInterval(() => {
      if (!cancelled) fetchMatches(false);
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMatches]);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Refresh the skill count from the database whenever the page (re)loads, so
  // the empty state never lies because of a stale login-time user object.
  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    api
      .get(`/users/${user._id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setDbSkillCount(
          (data.skillsToTeach || []).length + (data.skillsToLearn || []).length
        );
      })
      .catch(() => {
        /* non-fatal: we fall back to the auth-state count below */
      });
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  // Dropdown options are built from the data itself, so they always match
  // whatever values the backend actually stores.
  const experienceOptions = useMemo(
    () => [...new Set(matches.map((m) => m.user?.experienceLevel).filter(Boolean))].sort(),
    [matches]
  );
  const availabilityOptions = useMemo(
    () => [...new Set(matches.map((m) => m.user?.availability).filter(Boolean))].sort(),
    [matches]
  );

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const u = m.user || {};
      if (search) {
        const haystack = [
          u.name,
          u.bio,
          u.location,
          ...(u.skillsToTeach || []).map((s) => s.name),
          ...(u.skillsToLearn || []).map((s) => s.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (category) {
        const inCategory = [...(u.skillsToTeach || []), ...(u.skillsToLearn || [])].some(
          (s) => s.category === category
        );
        if (!inCategory) return false;
      }
      if (experience && u.experienceLevel !== experience) return false;
      if (availability && u.availability !== availability) return false;
      return true;
    });
  }, [matches, search, category, experience, availability]);

  const handleSwapSubmit = async (payload) => {
    const ok = await swap.submit(payload);
    if (ok) setNotice(`Swap request sent to ${swap.match.user.name}.`);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategory('');
    setExperience('');
    setAvailability('');
  };

  const hasFilters = search || category || experience || availability;

  // If the logged-in user hasn't listed ANY skills, matching can't find
  // anyone — say so directly instead of blaming the search/filters.
  // Prefer the fresh database count; fall back to the auth-state user.
  const mySkillCount =
    dbSkillCount ??
    ((user?.skillsToTeach || []).length + (user?.skillsToLearn || []).length);
  const selectCls =
    'w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Find a Skill Partner</h1>
          <p className="mt-1 text-sm text-slate-400">
            People whose skills complement yours, ranked by match score.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator: the list re-fetches every 10s while you're here */}
          <span
            className="inline-flex items-center gap-1.5 text-xs text-slate-400"
            title="Matches refresh automatically every 10 seconds"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
            {lastUpdated && (
              <span className="text-slate-600">
                · updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => fetchMatches(false)}
            disabled={refreshing || loading}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="shrink-0 hover:text-emerald-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 rounded-xl border border-white/10 bg-card p-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or skill…"
          className="w-full rounded-lg border border-white/10 bg-base px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className={selectCls} aria-label="Filter by experience level">
            <option value="">Any experience</option>
            {experienceOptions.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={selectCls} aria-label="Filter by availability">
            <option value="">Any availability</option>
            {availabilityOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-violet-300 hover:text-violet-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <Loader label="Finding your matches…" />
        ) : error ? (
          <EmptyState title="Something went wrong" hint={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No skill partners found"
            hint={
              mySkillCount === 0
                ? 'Add skills you can teach and skills you want to learn to discover matching partners.'
                : 'Try adjusting your search or filters.'
            }
            actionLabel={mySkillCount === 0 ? 'Go to My Skills' : undefined}
            actionTo={mySkillCount === 0 ? '/skills' : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <UserCard key={m.user._id} match={m} onSwap={swap.open} />
            ))}
          </div>
        )}
      </div>

      {/* Swap request modal */}
      {swap.isOpen && (
        <Modal title={`Swap skills with ${swap.match.user.name}`} onClose={swap.close}>
          {swap.partnerLoading ? (
            <Loader label="Loading profile…" />
          ) : (
            <SwapRequestForm
              me={swap.meFull || user}
              partner={swap.partner}
              onSubmit={handleSwapSubmit}
              submitting={swap.submitting}
              apiError={swap.error}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
