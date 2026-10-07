import { useMemo, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

// One skill-list editor: shows selected skills as removable chips, lets the
// user add more from the catalog dropdown, or create a brand-new skill when
// what they teach isn't listed. Duplicates are impossible — the dropdown only
// offers skills that aren't selected yet.
export default function SkillPicker({
  title,
  subtitle,
  catalog,
  selectedIds,
  onChange,
  onSkillCreated,
  emptyHint,
}) {
  const [pickValue, setPickValue] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Other');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [note, setNote] = useState('');

  const selectedById = useMemo(
    () => Object.fromEntries(catalog.map((s) => [s._id, s])),
    [catalog]
  );
  const selected = selectedIds.map((id) => selectedById[id]).filter(Boolean);

  // Catalog skills not yet selected, grouped by category for the dropdown.
  const groupedAvailable = useMemo(() => {
    const groups = {};
    for (const s of catalog) {
      if (selectedIds.includes(s._id)) continue;
      const cat = s.category || 'Other';
      (groups[cat] = groups[cat] || []).push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [catalog, selectedIds]);

  const categories = useMemo(
    () => [...new Set(catalog.map((s) => s.category).filter(Boolean))].sort(),
    [catalog]
  );

  const addFromCatalog = () => {
    if (!pickValue || selectedIds.includes(pickValue)) return;
    onChange([...selectedIds, pickValue]);
    setPickValue('');
    setNote('');
  };

  const remove = (id) => onChange(selectedIds.filter((x) => x !== id));

  const createSkill = async () => {
    const name = newName.trim();
    if (!name) {
      setCreateError('Give the skill a name.');
      return;
    }
    setCreateError('');
    setCreating(true);
    try {
      const { data } = await api.post('/skills', { name, category: newCategory });
      onSkillCreated(data); // add to the shared catalog dropdown
      if (!selectedIds.includes(data._id)) onChange([...selectedIds, data._id]);
      setNewName('');
      setShowCreate(false);
      setNote(`“${data.name}” was added to the skill list.`);
    } catch (err) {
      // 409 means the skill already exists — just select the existing one.
      if (err?.response?.status === 409 && err?.response?.data?.skill) {
        const existing = err.response.data.skill;
        onSkillCreated(existing);
        if (!selectedIds.includes(existing._id)) onChange([...selectedIds, existing._id]);
        setNewName('');
        setShowCreate(false);
      } else {
        setCreateError(apiErrorMessage(err, 'Could not create the skill.'));
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>

      {/* Selected skills as removable chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyHint}</p>
        ) : (
          selected.map((s) => (
            <span
              key={s._id}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-600/20 px-3 py-1.5 text-xs font-medium text-violet-200"
            >
              {s.name}
              <button
                type="button"
                onClick={() => remove(s._id)}
                className="rounded-full px-0.5 text-violet-300 hover:text-white"
                aria-label={`Remove ${s.name}`}
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add from the catalog */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={pickValue}
          onChange={(e) => setPickValue(e.target.value)}
          className="w-full flex-1 rounded-lg border border-white/10 bg-base px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          aria-label={`Add a skill to ${title}`}
        >
          <option value="">Choose a skill…</option>
          {groupedAvailable.map(([cat, list]) => (
            <optgroup key={cat} label={cat}>
              {list.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          onClick={addFromCatalog}
          disabled={!pickValue}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/25 hover:text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* Or create a new one */}
      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="mt-2 text-sm font-medium text-violet-300 hover:text-violet-200"
        >
          + Can&apos;t find it? Add a new skill
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-white/10 bg-base p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New skill name, e.g. Rust"
              maxLength={60}
              className="w-full flex-1 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              aria-label="New skill category"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={createSkill}
              disabled={creating}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {creating ? 'Adding…' : 'Add Skill'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setCreateError('');
                setNewName('');
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {createError && <p className="mt-2 text-sm text-rose-400">{createError}</p>}
        </div>
      )}

      {note && <p className="mt-2 text-xs text-emerald-300">{note}</p>}
    </div>
  );
}
