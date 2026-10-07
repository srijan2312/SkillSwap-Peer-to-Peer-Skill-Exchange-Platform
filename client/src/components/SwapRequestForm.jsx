import { useState } from 'react';
import { Link } from 'react-router-dom';

// The form rendered inside the swap-request Modal.
//
// Props:
// - me:      my fresh user record (needs skillsToTeach populated)
// - partner: the other user's full record (needs skillsToTeach populated)
// - onSubmit({ offeredSkill, requestedSkill, message }) — called on valid submit
export default function SwapRequestForm({ me, partner, onSubmit, submitting, apiError }) {
  const [offeredSkill, setOfferedSkill] = useState('');
  const [requestedSkill, setRequestedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  const mySkills = me?.skillsToTeach || [];
  const theirSkills = partner?.skillsToTeach || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!offeredSkill || !requestedSkill) {
      setFormError('Choose one skill to offer and one skill to request.');
      return;
    }
    setFormError('');
    onSubmit({ offeredSkill, requestedSkill, message: message.trim() || undefined });
  };

  const selectCls =
    'w-full rounded-lg border border-white/10 bg-base px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mySkills.length === 0 && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          You haven&apos;t listed any skills to teach yet.{' '}
          <Link to="/profile" className="underline">
            Add some on your profile
          </Link>{' '}
          first.
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">I want to learn</label>
        <select
          value={requestedSkill}
          onChange={(e) => setRequestedSkill(e.target.value)}
          className={selectCls}
        >
          <option value="">Select one of their teaching skills…</option>
          {theirSkills.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">I can teach</label>
        <select
          value={offeredSkill}
          onChange={(e) => setOfferedSkill(e.target.value)}
          className={selectCls}
          disabled={mySkills.length === 0}
        >
          <option value="">Select one of your teaching skills…</option>
          {mySkills.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          Message <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Hi! I'd love to trade skills…"
          className="w-full rounded-lg border border-white/10 bg-base px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {(formError || apiError) && <p className="text-sm text-rose-400">{formError || apiError}</p>}

      <button
        type="submit"
        disabled={submitting || mySkills.length === 0}
        className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Send Swap Request'}
      </button>
    </form>
  );
}
