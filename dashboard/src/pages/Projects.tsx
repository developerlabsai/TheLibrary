import { useState } from 'react';
import { api, type ProjectProfile } from '../services/api';

export default function Projects() {
  const [targetPath, setTargetPath] = useState('');
  const [profile, setProfile] = useState<ProjectProfile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!targetPath) return;
    setAnalyzing(true);
    setError('');
    setProfile(null);
    try {
      const result = await api.analyzeProject(targetPath);
      setProfile(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Projects</h2>
      <p className="text-gray-500 text-sm mb-6">Analyze and manage SpecKit installations in your projects</p>

      {/* Analyze Form */}
      <div className="bg-navy rounded-lg border border-gray-800 p-5 mb-6">
        <h3 className="text-white font-medium mb-3">Analyze a Project</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="/path/to/project"
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
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Analysis Result */}
      {profile && (
        <div className="bg-navy rounded-lg border border-gray-800 p-5">
          <h3 className="text-white font-medium mb-4">{profile.projectName}</h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoRow label="Path" value={profile.projectPath} mono />
            <InfoRow label="Language" value={profile.language || 'unknown'} />
            <InfoRow label="Framework" value={profile.framework || 'none detected'} />
            <InfoRow label="Suggested Profile" value={profile.suggestedProfile} highlight />
          </div>

          {/* Installation Status */}
          <h4 className="text-gray-400 text-sm mb-3">Installation Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatusBadge label="Git" installed={profile.hasGit} />
            <StatusBadge label="SpecKit" installed={profile.hasSpecKit} />
            <StatusBadge label="Beads" installed={profile.hasBeads} />
            <StatusBadge label="Claude" installed={profile.hasClaude} />
            <StatusBadge label="MCP Infra" installed={profile.hasMcpInfra} />
          </div>

          {/* Existing Skills */}
          {profile.existingSkills.length > 0 && (
            <div>
              <h4 className="text-gray-400 text-sm mb-2">Existing Skills ({profile.existingSkills.length})</h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.existingSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-gray-800 flex gap-3">
            {!profile.hasSpecKit && (
              <a
                href={`/deploy?path=${encodeURIComponent(profile.projectPath)}`}
                className="px-4 py-2 bg-emerald text-white text-sm rounded hover:bg-emerald/80 transition-colors"
              >
                Install SpecKit
              </a>
            )}
            {profile.hasSpecKit && (
              <span className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded">
                SpecKit already installed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className={`text-sm mt-0.5 ${highlight ? 'text-accent font-medium' : 'text-white'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ label, installed }: { label: string; installed: boolean }) {
  return (
    <div className={`rounded px-3 py-2 text-center ${installed ? 'bg-emerald/10 border border-emerald/30' : 'bg-gray-800/50 border border-gray-800'}`}>
      <p className={`text-xs font-medium ${installed ? 'text-emerald' : 'text-gray-600'}`}>
        {installed ? 'Installed' : 'Not installed'}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
