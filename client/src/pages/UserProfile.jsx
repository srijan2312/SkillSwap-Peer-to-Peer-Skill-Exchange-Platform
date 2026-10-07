import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import SkillTag from '../components/SkillTag';
import Stars from '../components/Stars';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import SwapRequestForm from '../components/SwapRequestForm';
import { useSwapRequest } from '../hooks/useSwapRequest';
import { timeAgo } from '../utils/format';

// Refresh another user's profile periodically so skill/profile changes
// appear without requiring the viewer to manually refresh the page.
const POLL_INTERVAL_MS = 5000;

export default function UserProfile() {
  const { id } = useParams();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const pollRef = useRef(null);

  const swap = useSwapRequest(me?._id);

  // Fetch the profile and reviews from the server.
  const fetchProfile = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
      setError('');
    }

    try {
      const [userRes, reviewRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/reviews/user/${id}`),
      ]);

      setProfile(userRes.data);
      setReviews(
        Array.isArray(reviewRes.data) ? reviewRes.data : []
      );

      setError('');
    } catch (err) {
      // Keep the last successful profile visible if a background
      // refresh temporarily fails.
      if (initial) {
        setError(
          apiErrorMessage(
            err,
            'Could not load this profile.'
          )
        );
      }
    } finally {
      if (initial) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    // Load the profile immediately.
    fetchProfile(true);

    // Refresh it every 5 seconds while the profile page is open.
    pollRef.current = setInterval(() => {
      if (!cancelled) {
        fetchProfile(false);
      }
    }, POLL_INTERVAL_MS);

    // Stop polling when the user leaves the profile.
    return () => {
      cancelled = true;

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchProfile]);

  const handleSwapSubmit = async (payload) => {
    const ok = await swap.submit(payload);

    if (ok) {
      setNotice(`Swap request sent to ${profile.name}.`);

      // Immediately refresh after sending a request.
      fetchProfile(false);
    }
  };

  if (loading) {
    return <Loader label="Loading profile…" />;
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load this profile"
        hint={error}
      />
    );
  }

  if (!profile) return null;

  const isOwn = me?._id === profile._id;

  const meta = [
    profile.location,
    profile.experienceLevel,
    profile.availability,
  ].filter(Boolean);

  return (
    <div>
      {notice && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span>{notice}</span>

          <button
            onClick={() => setNotice('')}
            className="shrink-0 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Profile header */}
      <div className="rounded-xl border border-white/10 bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar
            src={profile.avatar}
            name={profile.name}
            className="h-20 w-20"
            textClass="text-2xl"
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white">
              {profile.name}
            </h1>

            {meta.length > 0 && (
              <p className="mt-1 text-sm text-slate-400">
                {meta.join(' · ')}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Stars value={profile.rating} />

              <span className="text-sm text-slate-400">
                {(profile.rating || 0).toFixed(1)} (
                {profile.ratingCount || 0} reviews)
              </span>

              <span className="text-slate-600">·</span>

              <span className="text-sm text-slate-400">
                {profile.completedSwaps || 0} completed swaps
              </span>
            </div>

            {profile.bio && (
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="shrink-0 sm:ml-auto">
            {isOwn ? (
              <Link
                to="/profile"
                className="inline-block rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/25 hover:text-white"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={() => swap.open({ user: profile })}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                Send SkillSwap Request
              </button>
            )}
          </div>
        </div>

        {/* Teach / learn tags */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Can teach
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skillsToTeach?.length ? (
                profile.skillsToTeach.map((s) => (
                  <SkillTag
                    key={s._id}
                    name={s.name}
                    tone="teach"
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No teaching skills listed.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Wants to learn
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              {profile.skillsToLearn?.length ? (
                profile.skillsToLearn.map((s) => (
                  <SkillTag
                    key={s._id}
                    name={s.name}
                    tone="learn"
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No learning goals listed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <h2 className="mt-10 text-lg font-semibold text-white">
        Reviews
      </h2>

      {reviews.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No reviews yet"
            hint="Reviews appear here after completed swaps."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li
              key={r._id}
              className="rounded-xl border border-white/10 bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={r.reviewer?.avatar}
                  name={r.reviewer?.name}
                  className="h-8 w-8"
                  textClass="text-xs"
                />

                <span className="flex-1 truncate text-sm font-medium text-slate-200">
                  {r.reviewer?.name || 'Someone'}
                </span>

                <span className="shrink-0 text-xs text-slate-500">
                  {timeAgo(r.createdAt)}
                </span>
              </div>

              <div className="mt-2">
                <Stars value={r.rating} />
              </div>

              {r.comment && (
                <p className="mt-2 text-sm text-slate-300">
                  {r.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Swap request modal */}
      {swap.isOpen && (
        <Modal
          title={`Swap skills with ${profile.name}`}
          onClose={swap.close}
        >
          {swap.partnerLoading ? (
            <Loader label="Loading…" />
          ) : (
            <SwapRequestForm
              me={swap.meFull || me}
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