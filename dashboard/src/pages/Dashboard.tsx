import { useEffect, useState } from 'react';
import { api, type Stats } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
      <p className="text-gray-500 text-sm mb-8">TheLibrary asset overview</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatCard label="Agents" value={stats?.agents ?? 0} color="text-accent" />
        <StatCard label="Specialties" value={stats?.specialties ?? 0} color="text-emerald" />
        <StatCard label="Templates" value={stats?.templates ?? 0} color="text-purple-400" />
        <StatCard label="Teams" value={stats?.teams ?? 0} color="text-amber-400" />
        <StatCard label="Profiles" value={stats?.profiles ?? 0} color="text-pink-400" />
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          title="Deploy to Project"
          description="Deploy SpecKit, agents, specialties, and templates into a target project"
          href="/deploy"
        />
        <ActionCard
          title="Browse Assets"
          description="View all available agents, specialties, MCP servers, and templates"
          href="/assets"
        />
        <ActionCard
          title="Deploy Team"
          description="Deploy an entire workforce bundle in one operation"
          href="/teams"
        />
      </div>

      {/* CLI Reference */}
      <h3 className="text-lg font-semibold text-white mt-10 mb-4">CLI Quick Reference</h3>
      <div className="bg-navy rounded-lg border border-gray-800 p-5 font-mono text-sm">
        <div className="space-y-2 text-gray-400">
          <p><span className="text-accent">speckit</span> analyze /path/to/project</p>
          <p><span className="text-accent">speckit</span> deploy /path/to/project --specialties playbook,sop</p>
          <p><span className="text-accent">speckit</span> bundle /path/to/project bdr-team</p>
          <p><span className="text-accent">speckit</span> scaffold /path/to/new-project</p>
          <p><span className="text-accent">speckit</span> list all</p>
          <p><span className="text-accent">speckit</span> dashboard</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-navy rounded-lg border border-gray-800 p-5">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );
}

function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="block bg-navy rounded-lg border border-gray-800 p-5 hover:border-accent/50 transition-colors"
    >
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-gray-500 text-sm">{description}</p>
    </a>
  );
}
