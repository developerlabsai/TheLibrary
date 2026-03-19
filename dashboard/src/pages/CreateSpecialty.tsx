import { useState } from 'react';
import { api, type SpecialtyWizardInput } from '../services/api';

function ListEditor({ label, items, onChange, placeholder }: {
  label: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input className="flex-1 bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { e.preventDefault(); onChange([...items, draft.trim()]); setDraft(''); } }} placeholder={placeholder || 'Type and press Enter'} />
        <button type="button" onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(''); } }} className="px-3 py-2 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30">Add</button>
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

const OUTPUT_FORMATS = [
  'Standalone HTML document (Dev Labs design system)',
  'Markdown document',
  'JSON structured output',
  'Plain text',
];

export default function CreateSpecialty() {
  const [form, setForm] = useState<Partial<SpecialtyWizardInput>>({
    designSystem: false,
    mcpDependencies: [],
    sections: [],
    steps: [],
  });
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = form.displayName || '';
    const name = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const input: SpecialtyWizardInput = {
      name,
      displayName,
      description: form.description || '',
      invocationCommand: form.invocationCommand || `/${name}`,
      invocationArgs: form.invocationArgs || '<topic>',
      outputFormat: form.outputFormat || OUTPUT_FORMATS[0],
      designSystem: form.designSystem || false,
      mcpDependencies: form.mcpDependencies || [],
      sections: form.sections || [],
      steps: form.steps || [],
    };

    setStatus('creating');
    try {
      const res = await api.createSpecialty(input);
      setResult(res.outputDir);
      setStatus('done');
    } catch (err: any) {
      setResult(err.message);
      setStatus('error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Specialty Creation Wizard</h1>
      <p className="text-sm text-gray-500 mb-6">Define a new specialty with invocation, output format, and workflow steps.</p>

      {status === 'done' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
          <p className="text-emerald-400 font-medium mb-2">Specialty created successfully</p>
          <p className="text-sm text-gray-400">{result}</p>
          <button onClick={() => { setStatus('idle'); setForm({ designSystem: false, mcpDependencies: [], sections: [], steps: [] }); }} className="mt-4 px-4 py-2 bg-white/5 text-gray-300 rounded text-sm hover:bg-white/10">Create Another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name</label>
              <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder='e.g. "Account Research"' value={form.displayName || ''} onChange={(e) => set('displayName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="What this specialty produces" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Invocation Command</label>
              <input className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="/specialty-name" value={form.invocationCommand || ''} onChange={(e) => set('invocationCommand', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Arguments</label>
              <input className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="<company-name> or <topic>" value={form.invocationArgs || ''} onChange={(e) => set('invocationArgs', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Output Format</label>
              <select className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.outputFormat || OUTPUT_FORMATS[0]} onChange={(e) => { set('outputFormat', e.target.value); if (e.target.value.includes('HTML')) set('designSystem', true); }}>
                {OUTPUT_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={form.designSystem || false} onChange={(e) => set('designSystem', e.target.checked)} className="rounded border-gray-600" />
                Include Dev Labs design system
              </label>
            </div>
          </div>

          <ListEditor label="MCP Dependencies" items={form.mcpDependencies || []} onChange={(v) => set('mcpDependencies', v)} placeholder='e.g. "exa", "hubspot"' />
          <ListEditor label="Output Sections" items={form.sections || []} onChange={(v) => set('sections', v)} placeholder="e.g. Executive Summary" />
          <ListEditor label="Workflow Steps" items={form.steps || []} onChange={(v) => set('steps', v)} placeholder="e.g. Research the topic using available tools" />

          <button type="submit" disabled={status === 'creating'} className="px-6 py-2.5 bg-accent text-white rounded font-medium text-sm hover:bg-accent/80 disabled:opacity-50">
            {status === 'creating' ? 'Creating...' : 'Create Specialty'}
          </button>
          {status === 'error' && <p className="text-red-400 text-sm mt-2">{result}</p>}
        </form>
      )}
    </div>
  );
}
