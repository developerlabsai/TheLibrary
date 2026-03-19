import { useEffect, useState } from 'react';
import { api, type WorkforcePackage } from '../services/api';

export default function Packages() {
  const [packages, setPackages] = useState<WorkforcePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPackages().then(setPackages).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading packages...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Workforce Packages</h2>
      <p className="text-gray-500 text-sm mb-6">Pre-built bundles of agents, skills, and templates for common team configurations</p>

      <div className="grid gap-4">
        {packages.map((pkg) => (
          <div key={pkg.name} className="bg-navy rounded-lg border border-gray-800 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white text-lg font-semibold">{pkg.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{pkg.description}</p>
              </div>
              <span className="text-xs text-gray-600 font-mono">v{pkg.version}</span>
            </div>

            {/* Stats */}
            <div className="flex gap-4 mb-4">
              <div className="px-3 py-1.5 bg-accent/10 rounded text-xs text-accent">
                {pkg.agents.length} agents
              </div>
              <div className="px-3 py-1.5 bg-emerald/10 rounded text-xs text-emerald">
                {pkg.skills.length} skills
              </div>
              <div className="px-3 py-1.5 bg-purple-400/10 rounded text-xs text-purple-400">
                {pkg.templates.length} templates
              </div>
              {pkg.security && (
                <div className="px-3 py-1.5 bg-amber-400/10 rounded text-xs text-amber-400">
                  +security
                </div>
              )}
            </div>

            {/* Agents */}
            {pkg.agents.length > 0 && (
              <div className="mb-3">
                <p className="text-gray-500 text-xs mb-1.5">Agents:</p>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.agents.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-accent/10 rounded text-xs text-accent">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {pkg.skills.length > 0 && (
              <div className="mb-3">
                <p className="text-gray-500 text-xs mb-1.5">Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-emerald/10 rounded text-xs text-emerald">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Templates */}
            {pkg.templates.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs mb-1.5">Templates:</p>
                <div className="flex flex-wrap gap-1.5">
                  {pkg.templates.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400 font-mono">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Deploy Button */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-gray-500 text-xs font-mono">
                speckit bundle /path/to/project {pkg.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
