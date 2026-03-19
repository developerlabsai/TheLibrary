import { useState } from 'react';
import { api, type FeatureWizardInput } from '../services/api';

interface UserStory {
  title: string;
  priority: string;
  description: string;
  acceptanceCriteria: string[];
}

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

export default function CreateFeature() {
  const [name, setName] = useState('');
  const [featureNumber, setFeatureNumber] = useState(1);
  const [description, setDescription] = useState('');
  const [technicalApproach, setTechnicalApproach] = useState('');
  const [functionalRequirements, setFunctionalRequirements] = useState<string[]>([]);
  const [edgeCases, setEdgeCases] = useState<string[]>([]);
  const [successCriteria, setSuccessCriteria] = useState<string[]>([]);
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [currentStory, setCurrentStory] = useState<UserStory>({ title: '', priority: 'P1', description: '', acceptanceCriteria: [] });
  const [storyAc, setStoryAc] = useState('');
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');

  const branchName = `${featureNumber}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  const addAc = () => {
    if (storyAc.trim()) {
      setCurrentStory((s) => ({ ...s, acceptanceCriteria: [...s.acceptanceCriteria, storyAc.trim()] }));
      setStoryAc('');
    }
  };

  const addStory = () => {
    if (currentStory.title) {
      setStories([...stories, { ...currentStory }]);
      setCurrentStory({ title: '', priority: 'P1', description: '', acceptanceCriteria: [] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: FeatureWizardInput = {
      name,
      featureNumber,
      branchName,
      description,
      userStories: stories,
      functionalRequirements,
      edgeCases,
      successCriteria,
      openQuestions,
      technicalApproach: technicalApproach || undefined,
    };

    setStatus('creating');
    try {
      const res = await api.createFeature(input);
      setResult(res.outputDir);
      setStatus('done');
    } catch (err: any) {
      setResult(err.message);
      setStatus('error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Feature Spec Creation Wizard</h1>
      <p className="text-sm text-gray-500 mb-6">Creates spec.md + plan.md ready for deployment into any project.</p>

      {status === 'done' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
          <p className="text-emerald-400 font-medium mb-2">Feature spec created successfully</p>
          <p className="text-sm text-gray-400">{result}</p>
          <p className="text-xs text-gray-500 mt-2">Deploy with: speckit deploy-feature /path/to/project {branchName}</p>
          <button onClick={() => setStatus('idle')} className="mt-4 px-4 py-2 bg-white/5 text-gray-300 rounded text-sm hover:bg-white/10">Create Another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Feature Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Feature Name</label>
                <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder='e.g. "User Authentication"' value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Feature Number</label>
                <input type="number" className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={featureNumber} onChange={(e) => setFeatureNumber(parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Branch Name</label>
                <input disabled className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-gray-500" value={branchName} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none h-16 resize-none" placeholder="1-2 sentence description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          {/* User Stories */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">User Stories ({stories.length})</h2>

            {stories.length > 0 && (
              <div className="mb-4 space-y-2">
                {stories.map((s, i) => (
                  <div key={i} className="flex items-start justify-between bg-white/5 border border-gray-700 rounded px-3 py-2">
                    <div>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent mr-2">{s.priority}</span>
                      <span className="text-sm text-white">{s.title}</span>
                      <p className="text-xs text-gray-500 mt-1">{s.acceptanceCriteria.length} acceptance criteria</p>
                    </div>
                    <button type="button" onClick={() => setStories(stories.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 text-sm">&times;</button>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-dashed border-gray-700 rounded p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Add User Story</p>
              <div className="grid grid-cols-3 gap-3">
                <input className="bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="Story title" value={currentStory.title} onChange={(e) => setCurrentStory((s) => ({ ...s, title: e.target.value }))} />
                <select className="bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={currentStory.priority} onChange={(e) => setCurrentStory((s) => ({ ...s, priority: e.target.value }))}>
                  <option value="P1">P1 - Must have</option>
                  <option value="P2">P2 - Should have</option>
                  <option value="P3">P3 - Nice to have</option>
                </select>
                <input className="bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="As a user, I want..." value={currentStory.description} onChange={(e) => setCurrentStory((s) => ({ ...s, description: e.target.value }))} />
              </div>

              {currentStory.acceptanceCriteria.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentStory.acceptanceCriteria.map((ac, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white/5 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300">
                      {ac}
                      <button type="button" onClick={() => setCurrentStory((s) => ({ ...s, acceptanceCriteria: s.acceptanceCriteria.filter((_, j) => j !== i) }))} className="text-gray-500 hover:text-red-400">&times;</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input className="flex-1 bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="Given/When/Then acceptance criteria" value={storyAc} onChange={(e) => setStoryAc(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAc(); } }} />
                <button type="button" onClick={addAc} className="px-3 py-2 bg-white/5 text-gray-400 rounded text-sm hover:bg-white/10">+ AC</button>
              </div>
              <button type="button" onClick={addStory} className="px-4 py-2 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30">Add Story</button>
            </div>
          </div>

          {/* Requirements & Criteria */}
          <ListEditor label="Functional Requirements" items={functionalRequirements} onChange={setFunctionalRequirements} placeholder="The system must..." />
          <ListEditor label="Edge Cases" items={edgeCases} onChange={setEdgeCases} placeholder="What happens when..." />
          <ListEditor label="Success Criteria" items={successCriteria} onChange={setSuccessCriteria} placeholder="All acceptance tests pass" />
          <ListEditor label="Open Questions" items={openQuestions} onChange={setOpenQuestions} placeholder="Needs clarification..." />

          <div>
            <label className="block text-sm text-gray-400 mb-1">Technical Approach (optional)</label>
            <textarea className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none h-16 resize-none" placeholder="High-level technical approach notes" value={technicalApproach} onChange={(e) => setTechnicalApproach(e.target.value)} />
          </div>

          <button type="submit" disabled={status === 'creating'} className="px-6 py-2.5 bg-accent text-white rounded font-medium text-sm hover:bg-accent/80 disabled:opacity-50">
            {status === 'creating' ? 'Creating...' : 'Create Feature Spec'}
          </button>
          {status === 'error' && <p className="text-red-400 text-sm mt-2">{result}</p>}
        </form>
      )}
    </div>
  );
}
