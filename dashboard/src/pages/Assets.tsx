import { useEffect, useState } from 'react';
import { api, type Agent, type Specialty } from '../services/api';

type Tab = 'agents' | 'specialties' | 'templates';

export default function Assets() {
  const [tab, setTab] = useState<Tab>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([api.getAgents(), api.getSpecialties(), api.getTemplates()])
      .then(([a, s, t]) => {
        setAgents(a);
        setSpecialties(s);
        setTemplates(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAgents = agents.filter(
    (a) =>
      a.name.includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.includes(search.toLowerCase()))
  );

  const filteredSpecialties = specialties.filter(
    (s) =>
      s.name.includes(search.toLowerCase()) ||
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTemplates = templates.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-gray-500">Loading assets...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Assets</h2>
      <p className="text-gray-500 text-sm mb-6">Browse all agents, specialties, and templates in TheLibrary</p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search assets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-navy border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none mb-6"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {(['agents', 'specialties', 'templates'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize transition-colors ${
              tab === t
                ? 'text-accent border-b-2 border-accent -mb-px'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {t} ({t === 'agents' ? filteredAgents.length : t === 'specialties' ? filteredSpecialties.length : filteredTemplates.length})
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'agents' && (
        <div className="grid gap-3">
          {filteredAgents.map((agent) => (
            <div key={agent.name} className="bg-navy rounded-lg border border-gray-800 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">{agent.displayName}</h3>
                  <p className="text-gray-500 text-sm mt-1">{agent.description}</p>
                </div>
                <span className="text-xs text-gray-600 font-mono">v{agent.version}</span>
              </div>
              {agent.requiredSpecialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {agent.requiredSpecialties.map((specialty) => (
                    <span key={specialty} className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              {agent.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {agent.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-500">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'specialties' && (
        <div className="grid gap-3">
          {filteredSpecialties.map((specialty) => (
            <div key={specialty.name} className="bg-navy rounded-lg border border-gray-800 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium text-sm">
                    {specialty.displayName}
                    {specialty.hasReference && (
                      <span className="ml-2 text-xs text-emerald opacity-60">+ref</span>
                    )}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{specialty.description}</p>
                </div>
                <span className="text-xs text-gray-600 font-mono flex-shrink-0">v{specialty.version}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid gap-3">
          {filteredTemplates.map((template) => (
            <div key={template} className="bg-navy rounded-lg border border-gray-800 p-4">
              <p className="text-white text-sm font-mono">{template}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
