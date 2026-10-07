import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { apiErrorMessage, putFormData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const inputCls =
  'w-full rounded-lg border border-white/10 bg-base px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none';
const labelCls = 'mb-1 block text-sm font-medium text-slate-300';
const selectCls =
  'w-full rounded-lg border border-white/10 bg-base px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none';

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const AVAILABILITY_OPTIONS = ['Weekdays', 'Weekends', 'Evenings', 'Flexible'];

// Change password: current + new + confirm, posted to PUT /api/users/:id/password.
function ChangePassword({ userId }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current || !next) {
      setError('Fill in both password fields.');
      return;
    }
    if (next.length < 6) {
      setError('The new password must be at least 6 characters.');
      return;
    }
    if (next !== confirm) {
      setError('The new passwords do not match.');
      return;
    }
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${userId}/password`, {
        currentPassword: current,
        newPassword: next,
      });
      setNotice(data.message || 'Password changed successfully.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      // 401 = current password wrong; 400 = new password too short
      setError(apiErrorMessage(err, 'Could not change your password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-card p-6">
      <h2 className="text-base font-semibold text-white">Change password</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        You&apos;ll need your current password to set a new one.
      </p>
      {notice && (
        <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
        <div>
          <label htmlFor="current-password" className={labelCls}>
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputCls}
            autoComplete="current-password"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="new-password" className={labelCls}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="At least 6 characters"
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelCls}>
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
        >
          {saving ? 'Changing…' : 'Change password'}
        </button>
      </form>
    </section>
  );
}

// Delete account: confirm, then DELETE /api/users/:id (the backend cascades
// to the user's swaps and reviews). On success we log out and land on the
// homepage with a "account deleted" notice.
function DeleteAccount({ userId }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Delete your account? This permanently removes your profile, skills, swap requests and reviews. This cannot be undone.'
    );
    if (!confirmed) return;
    setError('');
    setDeleting(true);
    try {
      await api.delete(`/users/${userId}`);
      logout(); // clears token + user
      navigate('/', { state: { accountDeleted: true } });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete your account.'));
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6">
      <h2 className="text-base font-semibold text-rose-300">Delete account</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Permanently delete your account and everything connected to it.
      </p>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="mt-4 rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete my account'}
      </button>
    </section>
  );
}

export default function Profile() {
  const { user: me, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    name: '',
    bio: '',
    location: '',
    experienceLevel: 'Beginner',
    availability: 'Flexible',
  });
  // The avatar already on the account (remote URL or /uploads/… path).
  const [currentAvatar, setCurrentAvatar] = useState('');
  // A newly chosen image file (not uploaded until Save is clicked).
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef(null);

  // Load the fresh profile.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: u } = await api.get(`/users/${me._id}`);
        if (cancelled) return;
        setForm({
          name: u.name || '',
          bio: u.bio || '',
          location: u.location || '',
          experienceLevel: u.experienceLevel || 'Beginner',
          availability: u.availability || 'Flexible',
        });
        setCurrentAvatar(u.avatar || '');
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, 'Could not load your profile.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me]);

  // Free the object URL when the preview is replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setAvatarError('');
    if (!file) return;
    // Client-side gate, same rules as the server (multer enforces them too).
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setAvatarError('Please choose an image file (jpeg, png, webp or gif).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('The image must be smaller than 2MB.');
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setError('');
    setNotice('');
    setSaving(true);
    try {
      let data;
      if (avatarFile) {
        // A new image was chosen — send everything as multipart/form-data.
        // putFormData uses native fetch: axios would override the
        // Content-Type and break the multipart boundary multer needs.
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('bio', form.bio.trim());
        fd.append('location', form.location.trim());
        fd.append('experienceLevel', form.experienceLevel);
        fd.append('availability', form.availability);
        fd.append('avatar', avatarFile);
        data = await putFormData(`/users/${me._id}`, fd);
      } else {
        ({ data } = await api.put(`/users/${me._id}`, {
          name: form.name.trim(),
          bio: form.bio.trim(),
          location: form.location.trim(),
          experienceLevel: form.experienceLevel,
          availability: form.availability,
        }));
      }
      setUser(data); // refresh the navbar + auth state with the saved profile
      setCurrentAvatar(data.avatar || '');
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview('');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      setNotice('Profile updated successfully.');
      window.scrollTo({ top: 0 });
    } catch (err) {
      // e.g. 400 for an invalid avatar file, 403 if this somehow isn't your profile
      setError(apiErrorMessage(err, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading your profile…" />;
  if (error && !me) return <EmptyState title="Could not load your profile" hint={error} />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
      <p className="mt-1 text-sm text-slate-400">
        This is what other members see. Manage your skills on the{' '}
        <Link to="/skills" className="font-medium text-violet-300 hover:text-violet-200">
          My Skills
        </Link>{' '}
        page.
      </p>

      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        <div className="rounded-xl border border-white/10 bg-card p-6">
          {/* Avatar upload with instant preview */}
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarPreview || currentAvatar}
              name={form.name || me?.name}
              className="h-16 w-16"
              textClass="text-xl"
            />
            <div>
              <label htmlFor="avatar-file" className={labelCls}>
                Profile picture
              </label>
              <input
                id="avatar-file"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-base file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-200 hover:file:border-white/25"
              />
              <p className="mt-1 text-xs text-slate-600">JPEG, PNG, WebP or GIF — max 2MB.</p>
            </div>
          </div>
          {avatarError && <p className="mt-2 text-sm text-rose-400">{avatarError}</p>}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className={labelCls}>
                Name *
              </label>
              <input id="name" type="text" value={form.name} onChange={set('name')} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bio" className={labelCls}>
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={set('bio')}
                placeholder="A line or two about you…"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="location" className={labelCls}>
                Location
              </label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={set('location')}
                placeholder="City, Country"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="experienceLevel" className={labelCls}>
                Experience level
              </label>
              <select
                id="experienceLevel"
                value={form.experienceLevel}
                onChange={set('experienceLevel')}
                className={selectCls}
              >
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="availability" className={labelCls}>
                Availability
              </label>
              <select
                id="availability"
                value={form.availability}
                onChange={set('availability')}
                className={selectCls}
              >
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-6">
        <ChangePassword userId={me?._id} />
        <DeleteAccount userId={me?._id} />
      </div>
    </div>
  );
}
