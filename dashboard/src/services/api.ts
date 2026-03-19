/**
 * API client for the TheLibrary dashboard.
 */

const BASE_URL = '/api';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

export interface Agent {
  name: string;
  displayName: string;
  version: string;
  description: string;
  requiredSpecialties: string[];
  tags: string[];
}

export interface Specialty {
  name: string;
  displayName: string;
  version: string;
  description: string;
  hasReference: boolean;
}

export interface WorkforceTeam {
  name: string;
  description: string;
  version: string;
  agents: string[];
  specialties: string[];
  templates: string[];
  security: boolean;
}

export interface Stats {
  agents: number;
  specialties: number;
  templates: number;
  teams: number;
  profiles: number;
}

export interface ProjectProfile {
  projectName: string;
  projectPath: string;
  language: string | null;
  framework: string | null;
  hasGit: boolean;
  hasSpecKit: boolean;
  hasBeads: boolean;
  hasClaude: boolean;
  hasMcpInfra: boolean;
  suggestedProfile: string;
  existingSpecialties: string[];
}

export const api = {
  getStats: () => fetchJson<Stats>('/stats'),
  getAgents: () => fetchJson<{ agents: Agent[] }>('/agents').then((r) => r.agents),
  getSpecialties: () => fetchJson<{ specialties: Specialty[] }>('/specialties').then((r) => r.specialties),
  getTemplates: () => fetchJson<{ templates: string[] }>('/templates').then((r) => r.templates),
  getTeams: () => fetchJson<{ teams: WorkforceTeam[] }>('/teams').then((r) => r.teams),
  getProfiles: () =>
    fetchJson<{ profiles: { name: string; description: string }[] }>('/profiles').then(
      (r) => r.profiles
    ),

  analyzeProject: (targetPath: string) =>
    fetchJson<{ profile: ProjectProfile }>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ targetPath }),
    }).then((r) => r.profile),

  deploy: (options: {
    targetPath: string;
    profile?: string;
    specialties?: string[];
    agents?: string[];
    templates?: string[];
    security?: boolean;
    dryRun?: boolean;
  }) =>
    fetchJson<{ success: boolean; logs: string[] }>('/deploy', {
      method: 'POST',
      body: JSON.stringify(options),
    }),

  // ── Wizard endpoints ───────────────────────────────────────────

  createAgent: (input: AgentWizardInput) =>
    fetchJson<{ success: boolean; outputDir: string }>('/wizards/agent', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createSpecialty: (input: SpecialtyWizardInput) =>
    fetchJson<{ success: boolean; outputDir: string }>('/wizards/specialty', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createMcp: (input: McpWizardInput) =>
    fetchJson<{ success: boolean; outputDir: string }>('/wizards/mcp', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createFeature: (input: FeatureWizardInput) =>
    fetchJson<{ success: boolean; outputDir: string }>('/wizards/feature', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createTeam: (input: TeamWizardInput) =>
    fetchJson<{ success: boolean; outputDir: string }>('/wizards/team', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

// ── Wizard Input Types ─────────────────────────────────────────────

export interface AgentWizardInput {
  name: string;
  displayName: string;
  purpose: string;
  responsibilities: string[];
  operatingPrinciples: string[];
  preferredOutputFormats: string[];
  tone: string;
  requiredSpecialties: string[];
  tags: string[];
  personalizationFields?: string[];
  standingInstructions?: string[];
}

export interface SpecialtyWizardInput {
  name: string;
  displayName: string;
  description: string;
  invocationCommand: string;
  invocationArgs: string;
  outputFormat: string;
  designSystem: boolean;
  mcpDependencies: string[];
  sections: string[];
  steps: string[];
}

export interface McpWizardInput {
  name: string;
  displayName: string;
  apiBaseUrl: string;
  authType: string;
  authConfig: Record<string, string>;
  rateLimit: { requestsPerMinute: number; burstLimit: number };
  paginationStrategy: string;
  cacheTtlSeconds: number;
  retryConfig: { maxRetries: number; baseDelayMs: number; respectRetryAfter: boolean };
  transportType: string;
  endpoints: {
    name: string;
    method: string;
    path: string;
    description: string;
    parameters: { name: string; type: string; required: boolean; description: string }[];
  }[];
}

export interface FeatureWizardInput {
  name: string;
  featureNumber: number;
  branchName: string;
  description: string;
  userStories: {
    title: string;
    priority: string;
    description: string;
    acceptanceCriteria: string[];
  }[];
  functionalRequirements: string[];
  edgeCases: string[];
  successCriteria: string[];
  openQuestions: string[];
  technicalApproach?: string;
}

export interface TeamWizardInput {
  name: string;
  description: string;
  agents: string[];
  specialties: string[];
  templates: string[];
  constitutionProfile: string;
  security: boolean;
}
