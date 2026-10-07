import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ReviewForm from '../components/ReviewForm';
import SkillTag from '../components/SkillTag';
import Avatar from '../components/Avatar';
import { timeAgo } from '../utils/format';

const TABS = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'sent', label: 'Sent' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_STYLES = {
  Pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  Accepted: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  Rejected: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  Completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Cancelled: 'border-white/10 bg-white/5 text-slate-400',
};

const EMPTY_COPY = {
  incoming: {
    title: 'No pending requests',
    hint: 'Incoming swap requests will appear here.',
  },
  sent: {
    title: 'No sent requests',
    hint: 'Requests you send from Discover will appear here.',
  },
  active: {
    title: 'No active swaps',
    hint: 'Accepted swaps live here until completed.',
  },
  completed: {
    title: 'No completed swaps yet',
    hint: 'Finished exchanges will appear here.',
  },
};

// Refresh swap requests frequently because requests can be created
// or updated by another user while this page is open.
const POLL_INTERVAL_MS = 3000;

// sender/receiver may be populated objects or plain ids — handle both.
const idOf = (u) =>
  typeof u === 'object' && u !== null ? u._id : u;

export default function Swaps() {
  const { user: me } = useAuth();

  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('incoming');
  const [actingId, setActingId] = useState(null);
  const [reviewSwap, setReviewSwap] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const pollRef = useRef(null);

  // Fetch swaps from the server.
  const fetchSwaps = useCallback(async (initial = false) => {
    try {
      const { data } = await api.get('/swaps');

      setSwaps(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      // Only replace the page with an error on the first load.
      // During polling, keep showing the last successful result.
      if (initial) {
        setError(
          apiErrorMessage(
            err,
            'Could not load your swaps.'
          )
        );
      }
    } finally {
      if (initial) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Load immediately.
    fetchSwaps(true);

    // Check for new/updated requests every 3 seconds.
    pollRef.current = setInterval(() => {
      if (!cancelled) {
        fetchSwaps(false);
      }
    }, POLL_INTERVAL_MS);

    // Stop polling when the page is closed/unmounted.
    return () => {
      cancelled = true;

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchSwaps]);

  const isSender = (s) =>
    idOf(s.sender) === me._id;

  const partnerOf = (s) =>
    isSender(s) ? s.receiver : s.sender;

  // Two-sided completion: which completion flag belongs to me / my partner.
  const myCompleted = (s) =>
    isSender(s)
      ? !!s.senderCompleted
      : !!s.receiverCompleted;

  const partnerCompleted = (s) =>
    isSender(s)
      ? !!s.receiverCompleted
      : !!s.senderCompleted;

  // From MY perspective: what I teach and what I learn in this swap.
  const mySide = (s) =>
    isSender(s)
      ? {
          teach: s.offeredSkill,
          learn: s.requestedSkill,
        }
      : {
          teach: s.requestedSkill,
          learn: s.offeredSkill,
        };

  const updateStatus = async (swap, status) => {
    if (
      status === 'Rejected' &&
      !window.confirm('Reject this swap request?')
    ) {
      return;
    }

    setActingId(swap._id);
    setNotice('');

    try {
      const { data } = await api.put(
        `/swaps/${swap._id}`,
        { status }
      );

      // Two-sided completion: the swap only flips to Completed
      // when BOTH participants have marked their side.
      if (status === 'Completed') {
        setNotice(
          data.status === 'Completed'
            ? 'Swap completed. Nice work!'
            : 'Marked as completed. Waiting for your partner to complete.'
        );
      } else {
        setNotice(`Swap ${status.toLowerCase()}.`);
      }

      // Immediately update our own screen.
      await fetchSwaps(false);
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          'Could not update the swap.'
        )
      );
    } finally {
      setActingId(null);
    }
  };

  const deleteSwap = async (swap) => {
    if (
      !window.confirm(
        'Delete this swap request? This cannot be undone.'
      )
    ) {
      return;
    }

    setActingId(swap._id);
    setNotice('');

    try {
      await api.delete(`/swaps/${swap._id}`);

      setNotice('Swap request deleted.');

      await fetchSwaps(false);
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          'Could not delete the swap.'
        )
      );
    } finally {
      setActingId(null);
    }
  };

  const submitReview = async ({ rating, comment }) => {
    setReviewSubmitting(true);
    setReviewError('');

    try {
      await api.post('/reviews', {
        swapRequest: reviewSwap._id,
        rating,
        ...(comment ? { comment } : {}),
      });

      setReviewSwap(null);
      setNotice('Review submitted. Thanks!');

      // Refresh so the completed/review state is current.
      await fetchSwaps(false);
    } catch (err) {
      setReviewError(
        apiErrorMessage(
          err,
          'Could not submit the review.'
        )
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const incoming = swaps.filter(
    (s) =>
      !isSender(s) &&
      s.status === 'Pending'
  );

  const sent = swaps.filter(
    (s) =>
      isSender(s) &&
      ['Pending', 'Rejected', 'Cancelled'].includes(
        s.status
      )
  );

  const active = swaps.filter(
    (s) => s.status === 'Accepted'
  );

  const completed = swaps.filter(
    (s) => s.status === 'Completed'
  );

  const byTab = {
    incoming,
    sent,
    active,
    completed,
  };

  const visible = byTab[tab];

  const renderSwap = (s) => {
    const partner = partnerOf(s) || {};
    const side = mySide(s);
    const busy = actingId === s._id;

    return (
      <li
        key={s._id}
        className="rounded-xl border border-white/10 bg-card p-4 sm:p-5"
      >
        <div className="flex items-start gap-4">
          <Avatar
            src={partner.avatar}
            name={partner.name}
            className="h-11 w-11"
            textClass="text-sm"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/users/${partner._id}`}
                className="font-semibold text-white hover:text-violet-300"
              >
                {partner.name || 'Unknown user'}
              </Link>

              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[s.status] ||
                  STATUS_STYLES.Cancelled
                }`}
              >
                {s.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500">
                You teach
              </span>

              <SkillTag
                name={side.teach?.name || '—'}
                tone="teach"
              />

              <span className="text-slate-500">
                · you learn
              </span>

              <SkillTag
                name={side.learn?.name || '—'}
                tone="learn"
              />
            </div>

            {s.message && (
              <p className="mt-2 text-sm italic text-slate-400">
                “{s.message}”
              </p>
            )}

            <p className="mt-2 text-xs text-slate-600">
              {timeAgo(s.createdAt)}
            </p>
          </div>
        </div>

        {/* Tab-specific actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tab === 'incoming' && (
            <>
              <button
                onClick={() =>
                  updateStatus(s, 'Accepted')
                }
                disabled={busy}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {busy ? 'Working…' : 'Accept'}
              </button>

              <button
                onClick={() =>
                  updateStatus(s, 'Rejected')
                }
                disabled={busy}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}

          {tab === 'sent' &&
            s.status === 'Pending' && (
              <>
                <button
                  onClick={() =>
                    updateStatus(s, 'Cancelled')
                  }
                  disabled={busy}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() => deleteSwap(s)}
                  disabled={busy}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                >
                  Delete
                </button>
              </>
            )}

          {tab === 'sent' &&
            s.status !== 'Pending' && (
              <button
                onClick={() => deleteSwap(s)}
                disabled={busy}
                className="rounded-lg px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
              >
                Delete
              </button>
            )}

          {tab === 'active' && (
            <>
              {!myCompleted(s) ? (
                <button
                  onClick={() =>
                    updateStatus(s, 'Completed')
                  }
                  disabled={busy}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {busy
                    ? 'Working…'
                    : 'Mark as Completed'}
                </button>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
                  {partnerCompleted(s)
                    ? 'Both sides completed.'
                    : 'You marked this completed — waiting for your partner.'}
                </p>
              )}
            </>
          )}

          {tab === 'completed' && (
            <button
              onClick={() => {
                setReviewSwap(s);
                setReviewError('');
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/25 hover:text-white"
            >
              Leave a Review
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            My Swaps
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Track every skill exchange, from request to review.
          </p>
        </div>

        {/* Simple indicator showing that requests update automatically. */}
        <span
          className="hidden text-xs text-slate-500 sm:block"
          title="Swap requests refresh automatically every 3 seconds"
        >
          ● Live
        </span>
      </div>

      {notice && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span>{notice}</span>

          <button
            onClick={() => setNotice('')}
            className="shrink-0 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}{' '}
            <span className="text-xs opacity-70">
              ({byTab[t.key].length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <Loader label="Loading swaps…" />
        ) : error ? (
          <EmptyState
            title="Could not load your swaps"
            hint={error}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title={EMPTY_COPY[tab].title}
            hint={EMPTY_COPY[tab].hint}
          />
        ) : (
          <ul className="space-y-3">
            {visible.map(renderSwap)}
          </ul>
        )}
      </div>

      {/* Review modal */}
      {reviewSwap && (
        <Modal
          title={`Review ${
            partnerOf(reviewSwap)?.name ||
            'your partner'
          }`}
          onClose={() => {
            setReviewSwap(null);
            setReviewError('');
          }}
        >
          <ReviewForm
            onSubmit={submitReview}
            submitting={reviewSubmitting}
            apiError={reviewError}
          />
        </Modal>
      )}
    </div>
  );
}