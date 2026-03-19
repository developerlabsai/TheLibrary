import { useState } from 'react';
import { api, type AgentWizardInput } from '../services/api';

/** Reusable list editor for string arrays. */
function ListEditor({ label, items, onChange, placeholder }: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              e.preventDefault();
              onChange([...items, draft.trim()]);
              setDraft('');
            }
          }}
          placeholder={placeholder || 'Type and press Enter'}
        />
        <button
          type="button"
          onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(''); } }}
          className="px-3 py-2 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30"
        >Add</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-white/5 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300">
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">&times;</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CreateAgent() {
  const [form, setForm] = useState<Partial<AgentWizardInput>>({
    responsibilities: [],
    operatingPrinciples: [],
    preferredOutputFormats: [],
    requiredSkills: [],
    tags: [],
    personalizationFields: [],
    standingInstructions: [],
  });
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = form.displayName || '';
    const name = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const input: AgentWizardInput = {
      name,
      displayName,
      purpose: form.purpose || '',
      responsibilities: form.responsibilities || [],
      operatingPrinciples: form.operatingPrinciples || [],
      preferredOutputFormats: form.preferredOutputFormats || [],
      tone: form.tone || 'calm, polished, efficient',
      requiredSkills: form.requiredSkills || [],
      tags: form.tags || [],
      personalizationFields: form.personalizationFields,
      standingInstructions: form.standingInstructions,
    };

    setStatus('creating');
    try {
      const res = await api.createAgent(input);
      setResult(res.outputDir);
      setStatus('done');
    } catch (err: any) {
      setResult(err.message);
      setStatus('error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Agent Creation Wizard</h1>
      <p className="text-sm text-gray-500 mb-6">Define a new agent with role, responsibilities, skills, and tone.</p>

      {status === 'done' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
          <p className="text-emerald-400 font-medium mb-2">Agent created successfully</p>
          <p className="text-sm text-gray-400">{result}</p>
          <button onClick={() => { setStatus('idle'); setForm({ responsibilities: [], operatingPrinciples: [], preferredOutputFormats: [], requiredSkills: [], tags: [], personalizationFields: [], standingInstructions: [] }); }} className="mt-4 px-4 py-2 bg-white/5 text-gray-300 rounded text-sm hover:bg-white/10">Create Another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder='e.g. "Executive Assistant"' value={form.displayName || ''} onChange={(e) => set('displayName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tone / Style</label>
              <input className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="calm, polished, efficient" value={form.tone || ''} onChange={(e) => set('tone', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Purpose</label>
            <textarea required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none h-20 resize-none" placeholder="What does this agent do? (1-2 sentences)" value={form.purpose || ''} onChange={(e) => set('purpose', e.target.value)} />
          </div>

          <ListEditor label="Responsibilities" items={form.responsibilities || []} onChange={(v) => set('responsibilities', v)} placeholder="e.g. Strategic prioritization" />
          <ListEditor label="Operating Principles" items={form.operatingPrinciples || []} onChange={(v) => set('operatingPrinciples', v)} placeholder="e.g. Be proactive, not passive" />
          <ListEditor label="Preferred Output Formats" items={form.preferredOutputFormats || []} onChange={(v) => set('preferredOutputFormats', v)} placeholder="e.g. Daily brief" />
          <ListEditor label="Required Skills" items={form.requiredSkills || []} onChange={(v) => set('requiredSkills', v)} placeholder="e.g. account-research" />
          <ListEditor label="Tags" items={form.tags || []} onChange={(v) => set('tags', v)} placeholder="e.g. executive, productivity" />
          <ListEditor label="Personalization Fields" items={form.personalizationFields || []} onChange={(v) => set('personalizationFields', v)} placeholder="e.g. Principal name" />
          <ListEditor label="Standing Instructions" items={form.standingInstructions || []} onChange={(v) => set('standingInstructions', v)} placeholder="e.g. Always cc the team lead" />

          <button type="submit" disabled={status === 'creating'} className="px-6 py-2.5 bg-accent text-white rounded font-medium text-sm hover:bg-accent/80 disabled:opacity-50">
            {status === 'creating' ? 'Creating...' : 'Create Agent'}
          </button>

          {status === 'error' && <p className="text-red-400 text-sm mt-2">{result}</p>}
        </form>
      )}
    </div>
  );
}
