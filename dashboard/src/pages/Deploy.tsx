import { useState, useEffect } from 'react';
import { api, type Agent, type Specialty, type ProjectProfile } from '../services/api';

export default function Deploy() {
  const [targetPath, setTargetPath] = useState('');
  const [profile, setProfile] = useState<ProjectProfile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [includeSecurity, setIncludeSecurity] = useState(true);
  const [profiles, setProfiles] = useState<{ name: string; description: string }[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');

  useEffect(() => {
    Promise.all([api.getAgents(), api.getSpecialties(), api.getProfiles()])
      .then(([a, s, p]) => { setAgents(a); setSpecialties(s); setProfiles(p); })
      .catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (!targetPath) return;
    setAnalyzing(true);
    setProfile(null);
    try {
      const result = await api.analyzeProject(targetPath);
      setProfile(result);
      setSelectedProfile(result.suggestedProfile);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeploy = async () => {
    if (!targetPath) return;
    setDeploying(true);
    setDeployLogs([]);
    try {
      const result = await api.deploy({
        targetPath,
        profile: selectedProfile || undefined,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
        agents: selectedAgents.length > 0 ? selectedAgents : undefined,
        security: includeSecurity,
      });
      setDeployLogs(result.logs);
    } catch (err: any) {
      setDeployLogs([`Error: ${err.message}`]);
    } finally {
      setDeploying(false);
    }
  };

  const toggleSpecialty = (name: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const toggleAgent = (name: string) => {
    setSelectedAgents((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Deploy</h2>
      <p className="text-gray-500 text-sm mb-6">Deploy SpecKit into a target project</p>

      {/* Step 1: Target Path */}
      <div className="bg-navy rounded-lg border border-gray-800 p-5 mb-4">
        <h3 className="text-white font-medium mb-3">1. Target Project</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="/path/to/your/project"
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            className="flex-1 bg-[#0f0f1a] border border-gray-800 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none font-mono"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !targetPath}
            className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Step 2: Analysis Results */}
      {profile && (
        <div className="bg-navy rounded-lg border border-gray-800 p-5 mb-4">
          <h3 className="text-white font-medium mb-3">2. Analysis Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Language:</span> <span className="text-white">{profile.language || 'unknown'}</span></div>
            <div><span className="text-gray-500">Framework:</span> <span className="text-white">{profile.framework || 'none'}</span></div>
            <div><span className="text-gray-500">Git:</span> <span className={profile.hasGit ? 'text-emerald' : 'text-yellow-400'}>{profile.hasGit ? 'yes' : 'no'}</span></div>
            <div><span className="text-gray-500">SpecKit:</span> <span className={profile.hasSpecKit ? 'text-emerald' : 'text-gray-500'}>{profile.hasSpecKit ? 'installed' : 'not installed'}</span></div>
          </div>
          <div className="mt-3">
            <label className="text-gray-500 text-sm">Constitution Profile:</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="ml-2 bg-[#0f0f1a] border border-gray-800 rounded px-2 py-1 text-sm text-white focus:border-accent focus:outline-none"
            >
              {profiles.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} - {p.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 3: Select Assets */}
      {profile && (
        <div className="bg-navy rounded-lg border border-gray-800 p-5 mb-4">
          <h3 className="text-white font-medium mb-3">3. Select Assets</h3>

          {/* Security toggle */}
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={includeSecurity}
              onChange={(e) => setIncludeSecurity(e.target.checked)}
              className="accent-accent"
            />
            <span className="text-sm text-gray-400">Include security baseline</span>
          </label>

          {/* Agents */}
          <h4 className="text-gray-400 text-sm mb-2">Agents</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {agents.map((a) => (
              <button
                key={a.name}
                onClick={() => toggleAgent(a.name)}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedAgents.includes(a.name)
                    ? 'bg-accent text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {a.displayName}
              </button>
            ))}
          </div>

          {/* Specialties */}
          <h4 className="text-gray-400 text-sm mb-2">Specialties ({selectedSpecialties.length} selected)</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {specialties.map((s) => (
              <button
                key={s.name}
                onClick={() => toggleSpecialty(s.name)}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedSpecialties.includes(s.name)
                    ? 'bg-emerald text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {s.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Deploy */}
      {profile && (
        <div className="bg-navy rounded-lg border border-gray-800 p-5 mb-4">
          <h3 className="text-white font-medium mb-3">4. Deploy</h3>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="px-6 py-2.5 bg-emerald text-white text-sm font-medium rounded hover:bg-emerald/80 disabled:opacity-50 transition-colors"
          >
            {deploying ? 'Deploying...' : 'Deploy to Project'}
          </button>
        </div>
      )}

      {/* Deploy Logs */}
      {deployLogs.length > 0 && (
        <div className="bg-navy rounded-lg border border-gray-800 p-5">
          <h3 className="text-white font-medium mb-3">Deployment Output</h3>
          <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-96 overflow-auto">
            {deployLogs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
