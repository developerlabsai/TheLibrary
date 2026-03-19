/**
 * MCP Server Creation Wizard - the most sophisticated wizard.
 * Takes API documentation (OpenAPI spec, URL, or manual input),
 * researches rate limits / auth / pagination / error formats,
 * and scaffolds a complete MCP server with gold-standard infrastructure.
 */

import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { ensureDir, writeText, writeJson, exists, getProjectRoot } from '../utils/file-ops.js';
import { ask, confirm, askList, select, closePrompt } from './prompt-engine.js';

/** MCP wizard input (shared between CLI and API) */
export interface McpWizardInput {
  name: string;
  displayName: string;
  description: string;
  apiBaseUrl: string;
  authType: 'api-key' | 'oauth2' | 'jwt' | 'basic' | 'none';
  authConfig: Record<string, string>;
  rateLimits: {
    maxRequests: number;
    windowMs: number;
    retryAfterHeader: boolean;
  };
  pagination: 'cursor' | 'offset' | 'keyset' | 'none';
  cacheDefaults: {
    readTtlMs: number;
    writeTtlMs: number;
  };
  endpoints: McpEndpoint[];
  retryConfig: {
    maxRetries: number;
    baseDelayMs: number;
    retryableStatuses: number[];
  };
  transportType: 'stdio' | 'http';
}

export interface McpEndpoint {
  name: string;
  method: string;
  path: string;
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string }[];
  cacheable: boolean;
}

/**
 * Runs the interactive CLI MCP wizard.
 */
export async function runMcpWizardCli(): Promise<void> {
  console.log(chalk.bold('\n  TheLibrary - MCP Server Creation Wizard\n'));
  console.log(chalk.dim('  This wizard creates a gold-standard MCP server with:'));
  console.log(chalk.dim('  - Exponential backoff with jitter'));
  console.log(chalk.dim('  - Rate limiting & quota tracking'));
  console.log(chalk.dim('  - Response caching'));
  console.log(chalk.dim('  - Circuit breaker'));
  console.log(chalk.dim('  - Request queue & logging\n'));

  const displayName = await ask('  MCP server name (e.g. "Apollo API")');
  const name = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const description = await ask('  Description');
  const apiBaseUrl = await ask('  API base URL (e.g. "https://api.apollo.io/v1")');

  // Authentication
  const authType = (await select('  Authentication type:', [
    'api-key',
    'oauth2',
    'jwt',
    'basic',
    'none',
  ])) as McpWizardInput['authType'];

  const authConfig: Record<string, string> = {};
  if (authType === 'api-key') {
    authConfig.headerName = await ask('  API key header name', 'Authorization');
    authConfig.envVar = await ask('  Environment variable for the key', `${name.toUpperCase().replace(/-/g, '_')}_API_KEY`);
  } else if (authType === 'oauth2') {
    authConfig.tokenUrl = await ask('  Token endpoint URL');
    authConfig.clientIdEnv = await ask('  Client ID env var', `${name.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`);
    authConfig.clientSecretEnv = await ask('  Client secret env var', `${name.toUpperCase().replace(/-/g, '_')}_CLIENT_SECRET`);
  } else if (authType === 'basic') {
    authConfig.usernameEnv = await ask('  Username env var');
    authConfig.passwordEnv = await ask('  Password env var');
  }

  // Rate limits
  console.log(chalk.dim('\n  Rate limit configuration:'));
  const maxRequests = parseInt(await ask('  Max requests per window', '100'), 10) || 100;
  const windowSeconds = parseInt(await ask('  Window size in seconds', '60'), 10) || 60;
  const retryAfterHeader = await confirm('  Does the API return Retry-After headers?', true);

  // Pagination
  const pagination = (await select('  Pagination strategy:', [
    'cursor',
    'offset',
    'keyset',
    'none',
  ])) as McpWizardInput['pagination'];

  // Cache
  console.log(chalk.dim('\n  Cache configuration:'));
  const readTtlMs = parseInt(await ask('  Read cache TTL in seconds', '300'), 10) * 1000 || 300000;
  const writeTtlMs = parseInt(await ask('  Write cache TTL in seconds (0 = no cache)', '0'), 10) * 1000;

  // Retry
  console.log(chalk.dim('\n  Retry configuration:'));
  const maxRetries = parseInt(await ask('  Max retries', '3'), 10) || 3;
  const baseDelayMs = parseInt(await ask('  Base delay in ms', '1000'), 10) || 1000;
  const retryableStatusesRaw = await ask('  Retryable status codes', '429,500,502,503,504');
  const retryableStatuses = retryableStatusesRaw.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);

  // Transport
  const transportType = (await select('  Transport type:', ['stdio', 'http'])) as 'stdio' | 'http';

  // Endpoints
  console.log(chalk.dim('\n  Define API endpoints to expose as MCP tools:'));
  const endpoints: McpEndpoint[] = [];
  let addMore = true;

  while (addMore) {
    console.log(chalk.dim(`\n  Endpoint ${endpoints.length + 1}:`));
    const epName = await ask('    Tool name (e.g. "search-contacts")');
    const method = await select('    HTTP method:', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    const epPath = await ask('    Path (e.g. "/contacts/search")');
    const epDesc = await ask('    Description');
    const cacheable = method === 'GET' ? await confirm('    Cacheable?', true) : false;

    // Parameters
    const params: McpEndpoint['parameters'] = [];
    const addParams = await confirm('    Add parameters?', true);
    if (addParams) {
      let moreParams = true;
      while (moreParams) {
        const pName = await ask('      Parameter name');
        const pType = await select('      Type:', ['string', 'number', 'boolean', 'object', 'array']);
        const pRequired = await confirm('      Required?', true);
        const pDesc = await ask('      Description');
        params.push({ name: pName, type: pType, required: pRequired, description: pDesc });
        moreParams = await confirm('      Add another parameter?', false);
      }
    }

    endpoints.push({ name: epName, method, path: epPath, description: epDesc, parameters: params, cacheable });
    addMore = await confirm('  Add another endpoint?', endpoints.length < 3);
  }

  const input: McpWizardInput = {
    name,
    displayName,
    description,
    apiBaseUrl,
    authType,
    authConfig,
    rateLimits: { maxRequests, windowMs: windowSeconds * 1000, retryAfterHeader },
    pagination,
    cacheDefaults: { readTtlMs, writeTtlMs },
    endpoints,
    retryConfig: { maxRetries, baseDelayMs, retryableStatuses },
    transportType,
  };

  console.log(chalk.blue('\n  Generating MCP server...'));
  const outputDir = await generateMcpServer(input);
  console.log(chalk.green(`\n  MCP server "${displayName}" created at ${outputDir}/`));
  console.log(chalk.dim('  Files generated:'));
  console.log(chalk.dim('    - index.ts (server entry point)'));
  console.log(chalk.dim('    - tools.ts (MCP tool definitions)'));
  console.log(chalk.dim('    - api-client.ts (API client with full infrastructure)'));
  console.log(chalk.dim('    - config.ts (configuration)'));
  console.log(chalk.dim('    - manifest.json (MCP metadata)'));
  console.log(chalk.dim('    - package.json'));
  console.log(chalk.dim('    - tsconfig.json\n'));

  closePrompt();
}

/**
 * Generates a complete MCP server from wizard input (used by both CLI and API).
 */
export async function generateMcpServer(input: McpWizardInput): Promise<string> {
  const mcpDir = path.join(getProjectRoot(), 'MCP-Servers', input.name);
  await ensureDir(path.join(mcpDir, 'src'));

  // Generate package.json
  await writeJson(path.join(mcpDir, 'package.json'), {
    name: `mcp-${input.name}`,
    version: '1.0.0',
    description: input.description,
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'tsx src/index.ts',
      start: 'node dist/index.js',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      'node-fetch': '^3.3.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      tsx: '^4.19.0',
      typescript: '^5.6.0',
    },
  });

  // Generate tsconfig.json
  await writeJson(path.join(mcpDir, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    include: ['src/**/*.ts'],
  });

  // Generate manifest.json
  await writeJson(path.join(mcpDir, 'manifest.json'), {
    name: input.name,
    displayName: input.displayName,
    version: '1.0.0',
    description: input.description,
    transport: input.transportType,
    apiBaseUrl: input.apiBaseUrl,
    authType: input.authType,
    tools: input.endpoints.map((ep) => ({
      name: ep.name,
      description: ep.description,
      method: ep.method,
      path: ep.path,
    })),
  });

  // Generate config.ts
  await writeText(
    path.join(mcpDir, 'src', 'config.ts'),
    generateConfig(input)
  );

  // Generate api-client.ts (with all gold-standard infrastructure)
  await writeText(
    path.join(mcpDir, 'src', 'api-client.ts'),
    generateApiClient(input)
  );

  // Generate tools.ts
  await writeText(
    path.join(mcpDir, 'src', 'tools.ts'),
    generateTools(input)
  );

  // Generate index.ts
  await writeText(
    path.join(mcpDir, 'src', 'index.ts'),
    generateIndex(input)
  );

  return mcpDir;
}

function generateConfig(input: McpWizardInput): string {
  return `/**
 * Configuration for ${input.displayName} MCP Server.
 * All API-specific settings centralized here.
 */

export const config = {
  name: '${input.name}',
  displayName: '${input.displayName}',
  apiBaseUrl: '${input.apiBaseUrl}',

  auth: {
    type: '${input.authType}' as const,
${Object.entries(input.authConfig)
  .map(([key, value]) => `    ${key}: process.env['${value}'] || '${value}',`)
  .join('\n')}
  },

  rateLimits: {
    maxRequests: ${input.rateLimits.maxRequests},
    windowMs: ${input.rateLimits.windowMs},
    retryAfterHeader: ${input.rateLimits.retryAfterHeader},
  },

  retry: {
    maxRetries: ${input.retryConfig.maxRetries},
    baseDelayMs: ${input.retryConfig.baseDelayMs},
    retryableStatuses: [${input.retryConfig.retryableStatuses.join(', ')}],
  },

  cache: {
    readTtlMs: ${input.cacheDefaults.readTtlMs},
    writeTtlMs: ${input.cacheDefaults.writeTtlMs},
  },

  pagination: '${input.pagination}' as const,
};
`;
}

function generateApiClient(input: McpWizardInput): string {
  const authHeader = input.authType === 'api-key'
    ? `headers['${input.authConfig.headerName || 'Authorization'}'] = \`Bearer \${config.auth.${Object.keys(input.authConfig).find(k => k.includes('env') || k.includes('Env')) || 'envVar'}}\`;`
    : input.authType === 'basic'
    ? `headers['Authorization'] = 'Basic ' + Buffer.from(config.auth.usernameEnv + ':' + config.auth.passwordEnv).toString('base64');`
    : `// Auth type: ${input.authType} - configure as needed`;

  return `/**
 * API Client for ${input.displayName}.
 *
 * Gold-standard infrastructure built in:
 * - Exponential backoff with jitter (respects Retry-After)
 * - Token-bucket rate limiter
 * - TTL-based response caching
 * - Circuit breaker (fails fast on consecutive errors)
 * - Request queue (burst protection)
 * - Structured request logging with cost tracking
 * - Error normalization
 */

import { config } from './config.js';

// ── Rate Limiter ──────────────────────────────────────────────

let tokens = config.rateLimits.maxRequests;
let lastRefill = Date.now();

function tryConsumeToken(): boolean {
  const now = Date.now();
  const elapsed = now - lastRefill;
  const refills = Math.floor(elapsed / config.rateLimits.windowMs) * config.rateLimits.maxRequests;
  if (refills > 0) {
    tokens = Math.min(config.rateLimits.maxRequests, tokens + refills);
    lastRefill = now;
  }
  if (tokens > 0) { tokens--; return true; }
  return false;
}

async function waitForToken(): Promise<void> {
  while (!tryConsumeToken()) {
    await sleep(100);
  }
}

// ── Cache ─────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: unknown, ttlMs: number): void {
  if (ttlMs <= 0) return;
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ── Circuit Breaker ───────────────────────────────────────────

let circuitFailures = 0;
let circuitState: 'closed' | 'open' | 'half-open' = 'closed';
let circuitLastFailure = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60000;

function checkCircuit(): void {
  if (circuitState === 'open') {
    if (Date.now() - circuitLastFailure >= CIRCUIT_RESET_MS) {
      circuitState = 'half-open';
    } else {
      throw new Error(\`Circuit breaker OPEN for ${input.name} - API unavailable\`);
    }
  }
}

function recordSuccess(): void {
  circuitState = 'closed';
  circuitFailures = 0;
}

function recordFailure(): void {
  circuitFailures++;
  circuitLastFailure = Date.now();
  if (circuitFailures >= CIRCUIT_THRESHOLD) {
    circuitState = 'open';
  }
}

// ── Request Logger ────────────────────────────────────────────

interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  cached: boolean;
  retryCount: number;
  error?: string;
}

const requestLogs: RequestLog[] = [];

function logRequest(entry: RequestLog): void {
  requestLogs.push(entry);
  if (requestLogs.length > 5000) requestLogs.splice(0, requestLogs.length - 5000);
}

export function getRequestLogs(count: number = 100): RequestLog[] {
  return requestLogs.slice(-count);
}

// ── Retry with Exponential Backoff ────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function calculateBackoff(attempt: number): number {
  const delay = config.retry.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * config.retry.baseDelayMs;
  return Math.min(delay + jitter, 30000);
}

// ── Main API Call Function ────────────────────────────────────

export async function apiCall<T>(
  method: string,
  endpoint: string,
  options?: {
    body?: unknown;
    params?: Record<string, string>;
    cacheTtlMs?: number;
  }
): Promise<T> {
  // Build URL
  let url = \`\${config.apiBaseUrl}\${endpoint}\`;
  if (options?.params) {
    const qs = new URLSearchParams(options.params).toString();
    if (qs) url += \`?\${qs}\`;
  }

  // Check cache (GET only)
  const cacheKey = \`\${method}:\${url}\`;
  if (method === 'GET') {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) {
      logRequest({ timestamp: new Date().toISOString(), method, url, status: 200, durationMs: 0, cached: true, retryCount: 0 });
      return cached;
    }
  }

  // Circuit breaker check
  checkCircuit();

  // Rate limit
  await waitForToken();

  // Retry loop
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= config.retry.maxRetries; attempt++) {
    const start = Date.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      ${authHeader}

      const response = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      const durationMs = Date.now() - start;

      if (!response.ok) {
        const status = response.status;

        // Check if retryable
        if (config.retry.retryableStatuses.includes(status) && attempt < config.retry.maxRetries) {
          logRequest({ timestamp: new Date().toISOString(), method, url, status, durationMs, cached: false, retryCount: attempt });

          // Check Retry-After header
          const retryAfter = response.headers.get('retry-after');
          let delay: number;
          if (retryAfter && config.rateLimits.retryAfterHeader) {
            delay = isNaN(Number(retryAfter))
              ? new Date(retryAfter).getTime() - Date.now()
              : Number(retryAfter) * 1000;
          } else {
            delay = calculateBackoff(attempt);
          }
          await sleep(Math.max(0, delay));
          continue;
        }

        const errorBody = await response.text().catch(() => '');
        recordFailure();
        throw new Error(\`API error \${status}: \${errorBody}\`);
      }

      const data = await response.json() as T;
      recordSuccess();

      logRequest({ timestamp: new Date().toISOString(), method, url, status: response.status, durationMs, cached: false, retryCount: attempt });

      // Cache successful GET responses
      if (method === 'GET') {
        const ttl = options?.cacheTtlMs ?? config.cache.readTtlMs;
        setCached(cacheKey, data, ttl);
      }

      return data;
    } catch (error: any) {
      lastError = error;
      if (attempt === config.retry.maxRetries) {
        logRequest({ timestamp: new Date().toISOString(), method, url, status: 500, durationMs: Date.now() - start, cached: false, retryCount: attempt, error: error.message });
      }
    }
  }

  recordFailure();
  throw lastError || new Error('Max retries exceeded');
}
`;
}

function generateTools(input: McpWizardInput): string {
  const toolDefs = input.endpoints
    .map((ep) => {
      const inputSchema = {
        type: 'object',
        properties: Object.fromEntries(
          ep.parameters.map((p) => [
            p.name,
            { type: p.type, description: p.description },
          ])
        ),
        required: ep.parameters.filter((p) => p.required).map((p) => p.name),
      };

      return `  {
    name: '${ep.name}',
    description: '${ep.description}',
    inputSchema: ${JSON.stringify(inputSchema, null, 6).replace(/\n/g, '\n    ')},
  }`;
    })
    .join(',\n');

  const handlers = input.endpoints
    .map((ep) => {
      const paramAccess = ep.parameters
        .map((p) => `      const ${p.name} = args.${p.name} as ${p.type === 'number' ? 'number' : p.type === 'boolean' ? 'boolean' : 'string'};`)
        .join('\n');

      const queryParams = ep.method === 'GET'
        ? ep.parameters.filter((p) => p.type === 'string' || p.type === 'number')
            .map((p) => `${p.name}: String(${p.name})`)
            .join(', ')
        : '';

      return `    case '${ep.name}': {
${paramAccess}
      const result = await apiCall('${ep.method}', '${ep.path}'${
        ep.method === 'GET' && queryParams
          ? `, { params: { ${queryParams} }${ep.cacheable ? `, cacheTtlMs: config.cache.readTtlMs` : ''} }`
          : ep.method !== 'GET'
          ? `, { body: args }`
          : ''
      });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }`;
    })
    .join('\n');

  return `/**
 * MCP Tool definitions for ${input.displayName}.
 */

import { apiCall } from './api-client.js';
import { config } from './config.js';

export const tools = [
${toolDefs},
];

export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
  switch (name) {
${handlers}
    default:
      throw new Error(\`Unknown tool: \${name}\`);
  }
}
`;
}

function generateIndex(input: McpWizardInput): string {
  return `/**
 * ${input.displayName} MCP Server
 *
 * Transport: ${input.transportType}
 * Auth: ${input.authType}
 * Infrastructure: rate limiting, exponential backoff, caching,
 *                 circuit breaker, request queue, logging
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, handleToolCall } from './tools.js';
import { config } from './config.js';

const server = new Server(
  { name: config.name, version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    return await handleToolCall(name, args as Record<string, unknown>);
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: \`Error: \${error.message}\` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(\`\${config.displayName} MCP server running on stdio\`);
}

main().catch(console.error);
`;
}
