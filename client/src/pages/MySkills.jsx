import { useEffect, useRef, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillPicker from '../components/SkillPicker';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const idOf = (s) => (typeof s === 'object' && s !== null ? s._id : s);

// My Skills — the one place where teach/learn skills are managed.
// (The Profile page no longer has skill sections.)
//
// Every add/remove saves to the database IMMEDIATELY (no separate Save
// button): what you see on screen is always what's stored. Saves are queued
// so rapid clicks can't race — the last change always wins on the server.
export default function MySkills() {
  const { user: me, setUser } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [teachIds, setTeachIds] = useState([]);
  const [learnIds, setLearnIds] = useState([]);

  // Latest ids, so a save queued behind another always sends the newest lists.
  const idsRef = useRef({ teach: [], learn: [] });
  // Serializes the PUTs: each save waits for the previous one to finish.
  const saveChain = useRef(Promise.resolve());
  // Marks the most recent save; only it may clear the "Saving…" indicator.
  const latestTicket = useRef(null);

  // Load the fresh profile (skills populated) + the full skill catalog.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      try {
        const [meRes, skillRes] = await Promise.all([
          api.get(`/users/${me._id}`),
          api.get('/skills'),
        ]);
        if (cancelled) return;
        const u = meRes.data;
        const teach = (u.skillsToTeach || []).map(idOf);
        const learn = (u.skillsToLearn || []).map(idOf);
        setTeachIds(teach);
        setLearnIds(learn);
        idsRef.current = { teach, learn };
        setCatalog(skillRes.data || []);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load your skills.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me]);

  // When a brand-new skill is created from one of the pickers, merge it into
  // the shared catalog so the other picker can offer it too.
  const handleSkillCreated = (skill) => {
    setCatalog((prev) =>
      prev.some((s) => s._id === skill._id) ? prev : [...prev, skill]
    );
  };

  // Persist the current lists. Queued behind any in-flight save; the response
  // refreshes the auth state so the navbar, dashboard, and Discover update too.
  const persist = () => {
    const { teach, learn } = idsRef.current;
    setError('');
    setSaving(true);
    const ticket = {};
    latestTicket.current = ticket;
    saveChain.current = saveChain.current.then(async () => {
      try {
        const { data } = await api.put(`/users/${me._id}`, {
          skillsToTeach: teach,
          skillsToLearn: learn,
        });
        setUser(data); // keep navbar + auth state in sync with what's stored
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not save your skills. Please try again.'));
      } finally {
        if (latestTicket.current === ticket) setSaving(false);
      }
    });
  };

  const onTeachChange = (ids) => {
    setTeachIds(ids);
    idsRef.current = { ...idsRef.current, teach: ids };
    persist();
  };

  const onLearnChange = (ids) => {
    setLearnIds(ids);
    idsRef.current = { ...idsRef.current, learn: ids };
    persist();
  };

  if (loading) return <Loader label="Loading your skills…" />;
  if (error && catalog.length === 0)
    return <EmptyState title="Could not load your skills" hint={error} />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Skills</h1>
          <p className="mt-1 text-sm text-slate-400">
            This is what matching is based on — the more accurate your lists, the
            better your partners.
          </p>
        </div>
        {/* Save status: every change is stored immediately. */}
        <span className="shrink-0 text-xs text-slate-500" aria-live="polite">
          {saving ? 'Saving…' : 'All changes saved'}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <SkillPicker
            title="Skills I can teach"
            subtitle="Add the skills you'd offer in a swap."
            catalog={catalog}
            selectedIds={teachIds}
            onChange={onTeachChange}
            onSkillCreated={handleSkillCreated}
            emptyHint="You haven't added any teaching skills yet."
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-card p-6">
          <SkillPicker
            title="Skills I want to learn"
            subtitle="Add the skills you'd request in a swap."
            catalog={catalog}
            selectedIds={learnIds}
            onChange={onLearnChange}
            onSkillCreated={handleSkillCreated}
            emptyHint="You haven't added any skills you want to learn yet."
          />
        </div>
      </div>
    </div>
  );
}
