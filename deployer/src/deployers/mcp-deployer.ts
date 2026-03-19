/**
 * MCP deployer - deploys MCP servers and the shared MCP infrastructure
 * (.mcp-infra/) into target projects. Ensures uniform infrastructure
 * across all projects.
 */

import path from 'path';
import fs from 'fs-extra';
import {
  ensureDir,
  copyDirMerge,
  exists,
  readJson,
  writeJson,
  getLibraryRoot,
} from '../utils/file-ops.js';
import { MCP_INFRA_VERSION, compareVersions } from '../utils/version.js';
import type { DeployOptions } from '../types.js';

export interface McpDeployResult {
  infraDeployed: boolean;
  infraUpdated: boolean;
  serversDeployed: string[];
  skipped: string[];
  warnings: string[];
}

interface McpInfraVersion {
  version: string;
  deployedAt: string;
}

/**
 * Deploys the shared MCP infrastructure into the target project.
 * This is the foundation that ALL MCP servers share.
 */
export async function deployMcpInfra(
  targetPath: string,
  dryRun: boolean = false
): Promise<{ deployed: boolean; updated: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  const infraDir = path.join(targetPath, '.mcp-infra');
  const versionFile = path.join(infraDir, 'version.json');
  const libraryRoot = getLibraryRoot();
  const infraSource = path.join(libraryRoot, 'mcp-templates', 'infrastructure');

  if (dryRun) {
    const infraExists = await exists(infraDir);
    return {
      deployed: !infraExists,
      updated: infraExists,
      warnings: [],
    };
  }

  // Check if infrastructure already exists
  if (await exists(infraDir)) {
    // Version check
    const currentVersion = await readJson<McpInfraVersion>(versionFile);
    if (currentVersion && compareVersions(currentVersion.version, MCP_INFRA_VERSION) >= 0) {
      return {
        deployed: false,
        updated: false,
        warnings: ['MCP infrastructure is up to date'],
      };
    }

    // Update: copy new files over
    if (await exists(infraSource)) {
      await copyDirMerge(infraSource, infraDir);
    }
    await writeJson(versionFile, {
      version: MCP_INFRA_VERSION,
      deployedAt: new Date().toISOString(),
    });
    return { deployed: false, updated: true, warnings: [] };
  }

  // Fresh deployment
  await ensureDir(infraDir);

  if (await exists(infraSource)) {
    await fs.copy(infraSource, infraDir, { overwrite: true });
  } else {
    // Generate default infrastructure files
    await generateDefaultInfrastructure(infraDir);
    warnings.push('MCP infrastructure templates not found in library - generated defaults');
  }

  await writeJson(versionFile, {
    version: MCP_INFRA_VERSION,
    deployedAt: new Date().toISOString(),
  });

  return { deployed: true, updated: false, warnings };
}

/**
 * Generates default MCP infrastructure files when the library templates
 * don't exist yet.
 */
async function generateDefaultInfrastructure(infraDir: string): Promise<void> {
  // Rate limiter
  await fs.writeFile(
    path.join(infraDir, 'rate-limiter.ts'),
    `/**
 * Token-bucket rate limiter for MCP API calls.
 * Configurable per-API with different rate windows.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  name: string;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  config: RateLimitConfig;
}

const buckets = new Map<string, TokenBucket>();

/**
 * Creates or retrieves a rate limiter for a specific API.
 */
export function getRateLimiter(config: RateLimitConfig): TokenBucket {
  if (!buckets.has(config.name)) {
    buckets.set(config.name, {
      tokens: config.maxRequests,
      lastRefill: Date.now(),
      config,
    });
  }
  return buckets.get(config.name)!;
}

/**
 * Attempts to consume a token. Returns true if allowed, false if rate limited.
 */
export async function tryConsume(name: string): Promise<boolean> {
  const bucket = buckets.get(name);
  if (!bucket) return true; // No limiter configured

  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const refillAmount = Math.floor(elapsed / bucket.config.windowMs) * bucket.config.maxRequests;

  if (refillAmount > 0) {
    bucket.tokens = Math.min(bucket.config.maxRequests, bucket.tokens + refillAmount);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

/**
 * Wraps an async function with rate limiting.
 */
export async function withRateLimit<T>(
  name: string,
  fn: () => Promise<T>,
  config?: RateLimitConfig
): Promise<T> {
  if (config) getRateLimiter(config);

  while (!(await tryConsume(name))) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return fn();
}
`
  );

  // Retry handler
  await fs.writeFile(
    path.join(infraDir, 'retry-handler.ts'),
    `/**
 * Exponential backoff with jitter for resilient API calls.
 * Respects Retry-After headers when present.
 */

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatuses: number[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Calculates delay with exponential backoff and jitter.
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * config.baseDelayMs;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Wraps an async function with exponential backoff retry logic.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === fullConfig.maxRetries) break;

      // Check if error is retryable
      const status = error?.status || error?.response?.status;
      if (status && !fullConfig.retryableStatuses.includes(status)) {
        throw error; // Non-retryable status
      }

      // Check for Retry-After header
      const retryAfter = error?.response?.headers?.['retry-after'];
      let delay: number;

      if (retryAfter) {
        delay = isNaN(Number(retryAfter))
          ? new Date(retryAfter).getTime() - Date.now()
          : Number(retryAfter) * 1000;
      } else {
        delay = calculateDelay(attempt, fullConfig);
      }

      await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
`
  );

  // Cache layer
  await fs.writeFile(
    path.join(infraDir, 'cache-layer.ts'),
    `/**
 * TTL-based response cache for MCP API calls.
 * Configurable per endpoint with default 5min TTL for reads.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Gets a cached value if it exists and hasn't expired.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Sets a value in the cache with a TTL.
 */
export function setCached<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidates a cache entry.
 */
export function invalidate(key: string): void {
  cache.delete(key);
}

/**
 * Invalidates all cache entries matching a prefix.
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clears the entire cache.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Wraps an async function with caching.
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const result = await fn();
  setCached(key, result, ttlMs);
  return result;
}
`
  );

  // Circuit breaker
  await fs.writeFile(
    path.join(infraDir, 'circuit-breaker.ts'),
    `/**
 * Circuit breaker pattern - prevents hammering a down API.
 * Opens after N consecutive failures, auto-resets after cooldown.
 */

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailure: number;
  halfOpenAttempts: number;
  config: CircuitConfig;
}

const circuits = new Map<string, CircuitBreaker>();

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
  halfOpenMaxAttempts: 1,
};

function getCircuit(name: string, config?: Partial<CircuitConfig>): CircuitBreaker {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: 'closed',
      failureCount: 0,
      lastFailure: 0,
      halfOpenAttempts: 0,
      config: { ...DEFAULT_CONFIG, ...config },
    });
  }
  return circuits.get(name)!;
}

/**
 * Wraps an async function with circuit breaker protection.
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitConfig>
): Promise<T> {
  const circuit = getCircuit(name, config);

  // Check if circuit is open
  if (circuit.state === 'open') {
    const elapsed = Date.now() - circuit.lastFailure;
    if (elapsed >= circuit.config.resetTimeoutMs) {
      circuit.state = 'half-open';
      circuit.halfOpenAttempts = 0;
    } else {
      throw new Error(\`Circuit breaker open for "\${name}" - try again in \${Math.ceil((circuit.config.resetTimeoutMs - elapsed) / 1000)}s\`);
    }
  }

  // Half-open: limited attempts
  if (circuit.state === 'half-open' && circuit.halfOpenAttempts >= circuit.config.halfOpenMaxAttempts) {
    throw new Error(\`Circuit breaker half-open for "\${name}" - max attempts reached\`);
  }

  try {
    if (circuit.state === 'half-open') circuit.halfOpenAttempts++;
    const result = await fn();

    // Success: reset circuit
    circuit.state = 'closed';
    circuit.failureCount = 0;
    circuit.halfOpenAttempts = 0;

    return result;
  } catch (error) {
    circuit.failureCount++;
    circuit.lastFailure = Date.now();

    if (circuit.failureCount >= circuit.config.failureThreshold) {
      circuit.state = 'open';
    }

    throw error;
  }
}
`
  );

  // Error normalizer
  await fs.writeFile(
    path.join(infraDir, 'error-normalizer.ts'),
    `/**
 * Normalizes errors from different APIs into a consistent format.
 */

export interface NormalizedError {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
  source: string;
  originalError?: unknown;
}

/**
 * Normalizes any error into the standard format.
 */
export function normalizeError(error: unknown, source: string): NormalizedError {
  if (error instanceof Error) {
    const anyErr = error as any;
    const status = anyErr.status || anyErr.response?.status || 500;
    const retryable = [429, 500, 502, 503, 504].includes(status);

    return {
      code: anyErr.code || 'UNKNOWN_ERROR',
      message: error.message,
      status,
      retryable,
      source,
      originalError: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    status: 500,
    retryable: false,
    source,
    originalError: error,
  };
}
`
  );

  // Request logger
  await fs.writeFile(
    path.join(infraDir, 'request-logger.ts'),
    `/**
 * Structured request/response logging with cost tracking.
 */

export interface RequestLog {
  timestamp: string;
  source: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  cached: boolean;
  retryCount: number;
  error?: string;
  costEstimate?: number;
}

const logs: RequestLog[] = [];
const MAX_LOGS = 10000;

/**
 * Logs an API request.
 */
export function logRequest(entry: RequestLog): void {
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.splice(0, logs.length - MAX_LOGS);
  }
}

/**
 * Gets recent request logs.
 */
export function getRecentLogs(count: number = 100): RequestLog[] {
  return logs.slice(-count);
}

/**
 * Gets aggregate cost for a source.
 */
export function getCostBySource(source: string): number {
  return logs
    .filter((l) => l.source === source && l.costEstimate)
    .reduce((sum, l) => sum + (l.costEstimate || 0), 0);
}

/**
 * Wraps a fetch-like function with request logging.
 */
export async function withLogging<T>(
  source: string,
  method: string,
  url: string,
  fn: () => Promise<T>,
  options?: { costEstimate?: number }
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logRequest({
      timestamp: new Date().toISOString(),
      source,
      method,
      url,
      status: 200,
      durationMs: Date.now() - start,
      cached: false,
      retryCount: 0,
      costEstimate: options?.costEstimate,
    });
    return result;
  } catch (error: any) {
    logRequest({
      timestamp: new Date().toISOString(),
      source,
      method,
      url,
      status: error?.status || 500,
      durationMs: Date.now() - start,
      cached: false,
      retryCount: 0,
      error: error?.message || String(error),
      costEstimate: options?.costEstimate,
    });
    throw error;
  }
}
`
  );

  // Request queue
  await fs.writeFile(
    path.join(infraDir, 'request-queue.ts'),
    `/**
 * In-memory request queue for batch/burst protection.
 * Prevents flooding APIs with concurrent requests.
 */

interface QueueConfig {
  concurrency: number;
  name: string;
}

interface QueueItem<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

const queues = new Map<string, { config: QueueConfig; active: number; items: QueueItem<any>[] }>();

function getQueue(config: QueueConfig) {
  if (!queues.has(config.name)) {
    queues.set(config.name, { config, active: 0, items: [] });
  }
  return queues.get(config.name)!;
}

async function processNext(name: string): Promise<void> {
  const queue = queues.get(name);
  if (!queue || queue.items.length === 0 || queue.active >= queue.config.concurrency) {
    return;
  }

  queue.active++;
  const item = queue.items.shift()!;

  try {
    const result = await item.fn();
    item.resolve(result);
  } catch (error) {
    item.reject(error);
  } finally {
    queue.active--;
    processNext(name);
  }
}

/**
 * Enqueues a function to run with concurrency control.
 */
export function withQueue<T>(
  config: QueueConfig,
  fn: () => Promise<T>
): Promise<T> {
  const queue = getQueue(config);

  return new Promise<T>((resolve, reject) => {
    queue.items.push({ fn, resolve, reject });
    processNext(config.name);
  });
}
`
  );

  // Index (unified export)
  await fs.writeFile(
    path.join(infraDir, 'index.ts'),
    `/**
 * MCP Infrastructure - Unified exports.
 * All MCP servers import from this module for consistent
 * rate limiting, caching, retries, circuit breaking, and logging.
 */

export { withRateLimit, getRateLimiter } from './rate-limiter.js';
export { withRetry } from './retry-handler.js';
export { withCache, invalidate, invalidatePrefix, clearCache } from './cache-layer.js';
export { withCircuitBreaker } from './circuit-breaker.js';
export { normalizeError, type NormalizedError } from './error-normalizer.js';
export { withLogging, logRequest, getRecentLogs, getCostBySource } from './request-logger.js';
export { withQueue } from './request-queue.js';
`
  );
}
