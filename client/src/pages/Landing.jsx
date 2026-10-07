import { Link, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const features = [
  {
    title: 'Find your match',
    text: 'SkillSwap scores every member by how well your skills complement each other — a 2-way match means you both have something to teach.',
  },
  {
    title: 'Send swap requests',
    text: 'Offer one of your skills, request one of theirs, and add a personal note. No money, no fees — just an even trade.',
  },
  {
    title: 'Reviews & ratings',
    text: 'After each completed swap, both sides leave a rating. Trust is earned in public, so great teachers stand out.',
  },
];

const steps = [
  { n: '1', title: 'Create your profile', text: 'List the skills you can teach and the ones you want to learn.' },
  { n: '2', title: 'Discover matches', text: 'Browse partners ranked by 2-way and 1-way match strength.' },
  { n: '3', title: 'Send a swap request', text: 'Propose an exchange: your skill for theirs.' },
  { n: '4', title: 'Learn together', text: 'Complete the swap and leave a review.' },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const location = useLocation();
  // Shown after account deletion: Profile navigates here with
  // { accountDeleted: true } once the token is cleared.
  const [showDeleted, setShowDeleted] = useState(
    () => location.state?.accountDeleted === true
  );

  // Logged-in visitors skip the marketing page entirely.
  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <Loader />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-base text-slate-100">
      {showDeleted && (
        <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="text-sm text-emerald-300">
              Your account has been deleted.
            </p>
            <button
              onClick={() => setShowDeleted(false)}
              className="shrink-0 text-sm text-emerald-400 hover:text-emerald-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {/* Top bar */}
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <span className="text-xl font-bold tracking-tight text-white">
          Skill<span className="text-violet-400">Swap</span>
        </span>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero — the gradient wash lives only here (and the CTA below) */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.18),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <p className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            Peer-to-peer skill exchange
          </p>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Trade skills,{' '}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              not money
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            You teach React, someone teaches you Docker. SkillSwap matches you with people who
            want to learn what you know — and know what you want to learn.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="w-full rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 sm:w-auto"
            >
              Get Started — it&apos;s free
            </Link>
            <Link
              to="/login"
              className="w-full rounded-xl border border-white/10 bg-card px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white/25 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-card p-6">
              <h3 className="text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-white">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-xl border border-white/10 bg-card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/15 text-sm font-bold text-violet-300">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/register"
              className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start swapping skills
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        SkillSwap — trade skills, not money.
      </footer>
    </div>
  );
}
