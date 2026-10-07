import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import UserCard from '../components/UserCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import SwapRequestForm from '../components/SwapRequestForm';
import { useSwapRequest } from '../hooks/useSwapRequest';
import { timeAgo } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const swap = useSwapRequest(user?._id);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/dashboard');
        if (!cancelled) setData(data);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load your dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSwapSubmit = async (payload) => {
    const ok = await swap.submit(payload);
    if (ok) setNotice(`Swap request sent to ${swap.match.user.name}.`);
  };

  if (loading) return <Loader label="Loading your dashboard…" />;
  if (error) return <EmptyState title="Could not load your dashboard" hint={error} />;
  if (!data) return null;

  const stats = data.stats || {};
  const topMatches = data.topMatches || [];
  const recentActivity = data.recentActivity || [];
  const pending = (stats.pendingIncoming || 0) + (stats.pendingSent || 0);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-400">Here&apos;s what&apos;s happening with your skill swaps.</p>

      {notice && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="shrink-0 hover:text-emerald-200">
            Dismiss
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Skills I Teach" value={stats.skillsToTeach || 0} />
        <StatCard label="Skills I Want" value={stats.skillsToLearn || 0} />
        <StatCard label="Pending Requests" value={pending} />
        <StatCard label="Active Swaps" value={stats.activeSwaps || 0} />
        <StatCard label="Completed Swaps" value={stats.completedSwaps || 0} />
      </div>

      {/* Recommended partners */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recommended Skill Partners</h2>
        <Link to="/discover" className="text-sm font-medium text-violet-300 hover:text-violet-200">
          View all →
        </Link>
      </div>
      {topMatches.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No recommendations yet"
            hint="Add skills you teach and want to learn on the My Skills page to get matched."
            actionLabel="Go to My Skills"
            actionTo="/skills"
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topMatches.slice(0, 3).map((m) => (
            <UserCard key={m.user._id} match={m} onSwap={swap.open} />
          ))}
        </div>
      )}

      {/* Recent activity */}
      <h2 className="mt-10 text-lg font-semibold text-white">Recent Activity</h2>
      {recentActivity.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No activity yet"
            hint="Your swap requests and reviews will show up here."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {recentActivity.map((a, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-card px-4 py-3"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  a.type === 'review' ? 'bg-blue-500' : 'bg-violet-500'
                }`}
              />
              <p className="flex-1 text-sm text-slate-300">{a.text}</p>
              <span className="shrink-0 text-xs text-slate-500">{timeAgo(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

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
