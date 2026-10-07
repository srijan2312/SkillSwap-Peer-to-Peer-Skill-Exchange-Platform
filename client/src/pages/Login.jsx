import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';
import Loader from '../components/Loader';

const inputCls =
  'w-full rounded-lg border border-white/10 bg-base px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none';
const labelCls = 'mb-1 block text-sm font-medium text-slate-300';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-base">
        <Loader />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    if (!email.trim() || !password) return 'Email and password are required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    setApiError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err2) {
      // e.g. 401 { message: 'Invalid credentials' }
      setApiError(apiErrorMessage(err2, 'Login failed. Check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-block text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          ← Back to home
        </Link>
        <Link to="/" className="block text-center text-2xl font-bold tracking-tight text-white">
          Skill<span className="text-violet-400">Swap</span>
        </Link>
        <div className="mt-6 rounded-xl border border-white/10 bg-card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to continue swapping skills.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className={labelCls}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="current-password"
              />
            </div>

            {(formError || apiError) && (
              <p className="text-sm text-rose-400">{formError || apiError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            New to SkillSwap?{' '}
            <Link to="/register" className="font-medium text-violet-300 hover:text-violet-200">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
