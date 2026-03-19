import { useState } from 'react';
import { api, type McpWizardInput } from '../services/api';

interface Endpoint {
  name: string;
  method: string;
  path: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
}

const EMPTY_ENDPOINT: Endpoint = { name: '', method: 'GET', path: '', description: '', parameters: [] };

export default function CreateMcp() {
  const [form, setForm] = useState({
    displayName: '',
    apiBaseUrl: '',
    authType: 'api-key',
    authConfig: {} as Record<string, string>,
    requestsPerMinute: 60,
    burstLimit: 10,
    paginationStrategy: 'cursor',
    cacheTtlSeconds: 300,
    maxRetries: 3,
    baseDelayMs: 1000,
    respectRetryAfter: true,
    transportType: 'stdio',
  });
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [currentEndpoint, setCurrentEndpoint] = useState<Endpoint>({ ...EMPTY_ENDPOINT });
  const [currentParam, setCurrentParam] = useState({ name: '', type: 'string', required: true, description: '' });
  const [status, setStatus] = useState<'idle' | 'creating' | 'done' | 'error'>('idle');
  const [result, setResult] = useState('');

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const addEndpoint = () => {
    if (currentEndpoint.name && currentEndpoint.path) {
      setEndpoints([...endpoints, { ...currentEndpoint }]);
      setCurrentEndpoint({ ...EMPTY_ENDPOINT });
    }
  };

  const addParam = () => {
    if (currentParam.name) {
      setCurrentEndpoint((ep) => ({ ...ep, parameters: [...ep.parameters, { ...currentParam }] }));
      setCurrentParam({ name: '', type: 'string', required: true, description: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const input: McpWizardInput = {
      name,
      displayName: form.displayName,
      apiBaseUrl: form.apiBaseUrl,
      authType: form.authType,
      authConfig: form.authConfig,
      rateLimit: { requestsPerMinute: form.requestsPerMinute, burstLimit: form.burstLimit },
      paginationStrategy: form.paginationStrategy,
      cacheTtlSeconds: form.cacheTtlSeconds,
      retryConfig: { maxRetries: form.maxRetries, baseDelayMs: form.baseDelayMs, respectRetryAfter: form.respectRetryAfter },
      transportType: form.transportType,
      endpoints,
    };

    setStatus('creating');
    try {
      const res = await api.createMcp(input);
      setResult(res.outputDir);
      setStatus('done');
    } catch (err: any) {
      setResult(err.message);
      setStatus('error');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">MCP Server Creation Wizard</h1>
      <p className="text-sm text-gray-500 mb-6">Generate a gold-standard MCP server with built-in rate limiting, caching, retry, and circuit breaker.</p>

      {status === 'done' ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
          <p className="text-emerald-400 font-medium mb-2">MCP Server created successfully</p>
          <p className="text-sm text-gray-400">{result}</p>
          <button onClick={() => setStatus('idle')} className="mt-4 px-4 py-2 bg-white/5 text-gray-300 rounded text-sm hover:bg-white/10">Create Another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">API Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder='e.g. "HubSpot API"' value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Base URL</label>
                <input required className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="https://api.example.com/v3" value={form.apiBaseUrl} onChange={(e) => set('apiBaseUrl', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Auth Type</label>
                <select className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.authType} onChange={(e) => set('authType', e.target.value)}>
                  <option value="api-key">API Key</option>
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Transport</label>
                <select className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.transportType} onChange={(e) => set('transportType', e.target.value)}>
                  <option value="stdio">stdio</option>
                  <option value="http">HTTP/SSE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Infrastructure (Gold Standard)</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Requests / min</label>
                <input type="number" className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.requestsPerMinute} onChange={(e) => set('requestsPerMinute', parseInt(e.target.value) || 60)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Burst Limit</label>
                <input type="number" className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.burstLimit} onChange={(e) => set('burstLimit', parseInt(e.target.value) || 10)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cache TTL (sec)</label>
                <input type="number" className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.cacheTtlSeconds} onChange={(e) => set('cacheTtlSeconds', parseInt(e.target.value) || 300)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Retries</label>
                <input type="number" className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.maxRetries} onChange={(e) => set('maxRetries', parseInt(e.target.value) || 3)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Base Delay (ms)</label>
                <input type="number" className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.baseDelayMs} onChange={(e) => set('baseDelayMs', parseInt(e.target.value) || 1000)} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pagination</label>
                <select className="w-full bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={form.paginationStrategy} onChange={(e) => set('paginationStrategy', e.target.value)}>
                  <option value="cursor">Cursor-based</option>
                  <option value="offset">Offset-based</option>
                  <option value="page">Page number</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="bg-white/[0.02] border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">API Endpoints ({endpoints.length} defined)</h2>

            {endpoints.length > 0 && (
              <div className="mb-4 space-y-2">
                {endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-gray-700 rounded px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent">{ep.method}</span>
                      <span className="text-sm text-white font-mono">{ep.path}</span>
                      <span className="text-xs text-gray-500">{ep.name}</span>
                    </div>
                    <button type="button" onClick={() => setEndpoints(endpoints.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 text-sm">&times;</button>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-dashed border-gray-700 rounded p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Add Endpoint</p>
              <div className="grid grid-cols-4 gap-3">
                <input className="bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="Tool name" value={currentEndpoint.name} onChange={(e) => setCurrentEndpoint((ep) => ({ ...ep, name: e.target.value }))} />
                <select className="bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-accent focus:outline-none" value={currentEndpoint.method} onChange={(e) => setCurrentEndpoint((ep) => ({ ...ep, method: e.target.value }))}>
                  <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
                </select>
                <input className="bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="/endpoint/path" value={currentEndpoint.path} onChange={(e) => setCurrentEndpoint((ep) => ({ ...ep, path: e.target.value }))} />
                <input className="bg-white/5 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="Description" value={currentEndpoint.description} onChange={(e) => setCurrentEndpoint((ep) => ({ ...ep, description: e.target.value }))} />
              </div>

              {/* Parameters for current endpoint */}
              {currentEndpoint.parameters.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentEndpoint.parameters.map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white/5 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300">
                      {p.name}: {p.type} {p.required && '*'}
                      <button type="button" onClick={() => setCurrentEndpoint((ep) => ({ ...ep, parameters: ep.parameters.filter((_, j) => j !== i) }))} className="text-gray-500 hover:text-red-400">&times;</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-5 gap-2">
                <input className="bg-white/5 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="Param name" value={currentParam.name} onChange={(e) => setCurrentParam((p) => ({ ...p, name: e.target.value }))} />
                <select className="bg-white/5 border border-gray-700 rounded px-2 py-1.5 text-xs text-white focus:border-accent focus:outline-none" value={currentParam.type} onChange={(e) => setCurrentParam((p) => ({ ...p, type: e.target.value }))}>
                  <option>string</option><option>number</option><option>boolean</option><option>object</option><option>array</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input type="checkbox" checked={currentParam.required} onChange={(e) => setCurrentParam((p) => ({ ...p, required: e.target.checked }))} /> Required
                </label>
                <input className="bg-white/5 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:border-accent focus:outline-none" placeholder="Description" value={currentParam.description} onChange={(e) => setCurrentParam((p) => ({ ...p, description: e.target.value }))} />
                <button type="button" onClick={addParam} className="px-2 py-1.5 bg-white/5 text-gray-400 rounded text-xs hover:bg-white/10">+ Param</button>
              </div>

              <button type="button" onClick={addEndpoint} className="px-4 py-2 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30">Add Endpoint</button>
            </div>
          </div>

          <button type="submit" disabled={status === 'creating' || endpoints.length === 0} className="px-6 py-2.5 bg-accent text-white rounded font-medium text-sm hover:bg-accent/80 disabled:opacity-50">
            {status === 'creating' ? 'Creating...' : 'Create MCP Server'}
          </button>
          {status === 'error' && <p className="text-red-400 text-sm mt-2">{result}</p>}
        </form>
      )}
    </div>
  );
}
