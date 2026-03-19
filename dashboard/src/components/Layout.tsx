import { Outlet, NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '~' },
  { path: '/assets', label: 'Assets', icon: '#' },
  { path: '/deploy', label: 'Deploy', icon: '>' },
  { path: '/teams', label: 'Teams', icon: '=' },
  { path: '/projects', label: 'Projects', icon: '@' },
];

const wizardItems = [
  { path: '/create/agent', label: 'Agent', icon: '+' },
  { path: '/create/specialty', label: 'Specialty', icon: '+' },
  { path: '/create/mcp', label: 'MCP Server', icon: '+' },
  { path: '/create/feature', label: 'Feature', icon: '+' },
  { path: '/create/team', label: 'Team', icon: '+' },
];

export default function Layout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-56 bg-navy border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white tracking-tight">TheLibrary</h1>
          <p className="text-xs text-gray-500 mt-0.5">SpecKit Deployer</p>
        </div>
        <div className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'text-accent bg-accent/10 border-r-2 border-accent'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="font-mono text-xs w-4 text-center opacity-50">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="mt-4 mb-2 px-5">
            <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Wizards</p>
          </div>
          {wizardItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-400/10 border-r-2 border-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="font-mono text-xs w-4 text-center text-emerald-500/50">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">v1.0.0</p>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#0f0f1a]">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
