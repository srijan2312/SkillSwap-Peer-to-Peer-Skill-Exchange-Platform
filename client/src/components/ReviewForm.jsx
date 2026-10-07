import { useState } from 'react';

// Interactive review form rendered inside a Modal on the Swaps page.
// Props: onSubmit({ rating, comment }), submitting, apiError.
export default function ReviewForm({ onSubmit, submitting, apiError }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setFormError('Pick a rating between 1 and 5 stars.');
      return;
    }
    setFormError('');
    onSubmit({ rating, comment: comment.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Your rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-3xl transition-colors ${
                n <= rating ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'
              }`}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          Comment <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="How was the exchange?"
          className="w-full rounded-lg border border-white/10 bg-base px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {(formError || apiError) && <p className="text-sm text-rose-400">{formError || apiError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
