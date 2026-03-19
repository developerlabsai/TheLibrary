import { useState, useEffect } from 'react';
import { api, type PackageWizardInput, type Agent, type Skill } from '../services/api';

const PROFILES = [
  'web-app-typescript',
  'web-app-python',
  'slack-bot',
  'api-service',
  'cli-tool',
  'minimal',
];

export default function CreatePackage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [profile, setProfile] = useState(PROFILES[0]);
  const [security, setSecurity] = useState(true);
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');

  useEffect(() => {
    Promise.all([api.getAgents(), api.getSkills(), api.getTemplates()])
      .then(([a, s, t]) => { setAgents(a); setSkills(s); setTemplates(t); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: PackageWizardInput = {
      name,
      description,
      agents: selectedAgents,
      skills: selectedSkills,
      templates: selectedTemplates,
      constitutionProfile: profile,
      security,
    };

    setStatus('creating');
    try {
      const res = await api.createPackage(input);
      setResult(res.outputDir);
      setStatus('done');
    } catch (err: any) {
      setResult(err.message);
      setStatus('error');
    }
  };

  if (loading) return <p className="text-gray-500">Loading assets...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Package Creation Wizard</h1>
      <p className="text-sm text-gray-500 mb-6">Bundle agents, skills, and templates into a workforce package for one-command deployment.</p>

      {status === 'done' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
          <p className="text-emerald-400 font-medium mb-2">Package created successfully</p>
          <p className="text-sm text-gray-400">{result}</p>
          <p className="text-xs text-gray-500 mt-2">Deploy with: speckit bundle /path/to/project {name}</p>
          <button onClick={() => setStatus('idle')} className="mt-4 px-4 py-2 bg-white/5 text-gray-300 rounded text-sm hover:bg-white/10">Create Another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Package Name</label>
              <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder='e.g. "sales-team"' value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="What this package provides" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Constitution Profile</label>
              <select className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={profile} onChange={(e) => setProfile(e.target.value)}>
                {PROFILES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input type="checkbox" checked={security} onChange={(e) => setSecurity(e.target.checked)} className="rounded border-gray-600" />
                Include security baseline
              </label>
            </div>
          </div>

          {/* Agent Selection */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Agents ({selectedAgents.length} selected)</h2>
            <div className="grid grid-cols-2 gap-2">
              {agents.map((a) => (
                <label key={a.name} className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-colors ${selectedAgents.includes(a.name) ? 'bg-accent/10 border-accent/30' : 'bg-white/[0.02] border-gray-800 hover:border-gray-700'}`}>
                  <input type="checkbox" checked={selectedAgents.includes(a.name)} onChange={() => toggleItem(selectedAgents, a.name, setSelectedAgents)} className="rounded border-gray-600" />
                  <div>
                    <p className="text-sm text-white">{a.displayName}</p>
                    <p className="text-xs text-gray-500">{a.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Skill Selection */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Skills ({selectedSkills.length} selected)
              <button type="button" onClick={() => setSelectedSkills(selectedSkills.length === skills.length ? [] : skills.map((s) => s.name))} className="ml-3 text-xs text-accent hover:underline">
                {selectedSkills.length === skills.length ? 'Deselect All' : 'Select All'}
              </button>
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {skills.map((s) => (
                <label key={s.name} className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-colors ${selectedSkills.includes(s.name) ? 'bg-accent/10 border-accent/30' : 'bg-white/[0.02] border-gray-800 hover:border-gray-700'}`}>
                  <input type="checkbox" checked={selectedSkills.includes(s.name)} onChange={() => toggleItem(selectedSkills, s.name, setSelectedSkills)} className="rounded border-gray-600" />
                  <span className="text-sm text-gray-300">{s.displayName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Templates ({selectedTemplates.length} selected)
              <button type="button" onClick={() => setSelectedTemplates(selectedTemplates.length === templates.length ? [] : [...templates])} className="ml-3 text-xs text-accent hover:underline">
                {selectedTemplates.length === templates.length ? 'Deselect All' : 'Select All'}
              </button>
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {templates.map((t) => (
                <label key={t} className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-colors ${selectedTemplates.includes(t) ? 'bg-accent/10 border-accent/30' : 'bg-white/[0.02] border-gray-800 hover:border-gray-700'}`}>
                  <input type="checkbox" checked={selectedTemplates.includes(t)} onChange={() => toggleItem(selectedTemplates, t, setSelectedTemplates)} className="rounded border-gray-600" />
                  <span className="text-sm text-gray-300">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={status === 'creating'} className="px-6 py-2.5 bg-accent text-white rounded font-medium text-sm hover:bg-accent/80 disabled:opacity-50">
            {status === 'creating' ? 'Creating...' : 'Create Package'}
          </button>
          {status === 'error' && <p className="text-red-400 text-sm mt-2">{result}</p>}
        </form>
      )}
    </div>
  );
}
