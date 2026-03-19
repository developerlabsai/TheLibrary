/**
 * Core types for the SpecKit Deployer.
 */

/** Supported constitution profiles */
export type ConstitutionProfile =
  | 'web-app-typescript'
  | 'web-app-python'
  | 'slack-bot'
  | 'api-service'
  | 'cli-tool'
  | 'minimal';

/** Principle status in a constitution adaptation */
export type PrincipleStatus = 'PASS' | 'N/A' | 'DEVIATION' | 'ADAPT';

/** Result of project analysis */
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
  existingSpecialties: string[];
  existingMcpServers: string[];
  testFramework: string | null;
  database: string | null;
  cicd: string | null;
  suggestedProfile: ConstitutionProfile;
  principleAdaptations: Record<string, PrincipleStatus>;
}

/** OpenClaw-compatible workspace file set */
export interface WorkspaceFiles {
  soul: string;        // SOUL.md - persona, tone, values, boundaries
  agents: string;      // AGENTS.md - operating manual, workflows
  user: string;        // USER.md - human user profile template
  tools: string;       // TOOLS.md - environment-specific tool notes
  identity: string;    // IDENTITY.md - name, emoji, avatar
  bootstrap: string;   // BOOTSTRAP.md - first-run onboarding ritual
  heartbeat: string;   // HEARTBEAT.md - periodic task instructions
  memory: string;      // MEMORY.md - curated long-term memory
  boot?: string;       // BOOT.md - optional startup checklist
}

/** Heartbeat configuration */
export interface HeartbeatConfig {
  enabled: boolean;
  tasks: string[];
  interval?: string;   // e.g. "hourly", "daily", "15m"
}

/** Agent runtime loop configuration */
export interface RuntimeConfig {
  maxSteps: number;
  verifierEnabled: boolean;
  successCriteria: string[];
  allowedTools: string[];
  escalationRule: string;
}

/** Agent security boundaries (NemoClaw-inspired) */
export interface AgentSecurityConfig {
  allowedPaths: string[];
  deniedPaths: string[];
  allowedDomains: string[];
  maxIterations: number;
  requireHumanApproval: string[];
}

/** MCP server manifest */
export interface McpServerManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  transport: 'stdio' | 'http';
  apiBaseUrl: string;
  authType: string;
  tools: { name: string; description: string; method: string; path: string }[];
}

/** Agent manifest stored alongside each agent definition */
export interface AgentManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  files: Record<string, string>;
  requiredSpecialties: string[];
  requiredMcp: string[];
  tags: string[];
  runtimeConfig?: RuntimeConfig;
  heartbeatConfig?: HeartbeatConfig;
  securityConfig?: AgentSecurityConfig;
}

/** Specialty manifest (derived from SPECIALTY.md front matter) */
export interface SpecialtyInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  directory: string;
  hasReference: boolean;
  requiredMcp: string[];
}

/** Workforce team definition */
export interface WorkforceTeam {
  name: string;
  description: string;
  version: string;
  agents: string[];
  specialties: string[];
  templates: string[];
  mcpServers: string[];
  constitutionProfile: ConstitutionProfile;
  security: boolean;
}

/** Version stamp written to each deployed project */
export interface VersionStamp {
  speckitVersion: string;
  deployerVersion: string;
  deployedAt: string;
  profile: ConstitutionProfile;
  components: {
    speckit: string;
    beads: string;
    constitution: string;
    mcpInfra?: string;
    specialties: Record<string, string>;
    agents: Record<string, string>;
    templates: string[];
  };
}

/** Deploy options passed to the deploy command */
export interface DeployOptions {
  targetPath: string;
  profile?: ConstitutionProfile;
  specialties?: string[];
  agents?: string[];
  templates?: string[];
  features?: string[];
  security?: boolean;
  dryRun?: boolean;
  force?: boolean;
  scaffold?: boolean;
  version?: string;
  stub?: boolean;
  ttl?: number;
}

/** MCP creation options */
export interface McpCreateOptions {
  name: string;
  fromOpenapi?: string;
  fromUrl?: string;
  fromManual?: boolean;
  outputDir?: string;
}

// ── License & Registry Types ─────────────────────────────────────────
// Note: The existing codebase uses "specialties" (SpecialtyInfo, getAllSpecialties)
// for what the spec calls "skills". Preserve "specialties" in deployer code;
// map "skills" ↔ "specialties" in registry/asset-registry integration.

/** Subscription tier levels. */
export type LicenseTier = 'free' | 'pro' | 'enterprise';

/** License status returned by the license server validation endpoint. */
export interface LicenseStatus {
  valid: boolean;
  org_name: string;
  tier: LicenseTier;
  entitled_assets: string[];
  expires_at: string | null;
}

/** Credential file stored at ~/.speckit/credentials. */
export interface CredentialFile {
  key: string;
  registry_url: string;
}

/** Result of an entitlement check before deploy. */
export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: 'no_credentials' | 'invalid_key' | 'key_expired' | 'key_revoked' | 'tier_insufficient' | 'not_entitled';
  message: string;
  required_tier?: LicenseTier;
  current_tier?: LicenseTier;
}

/** Catalog entry from the registry API. */
export interface CatalogEntry {
  name: string;
  type: 'agent' | 'skill' | 'template' | 'package';
  tier: LicenseTier;
  description: string;
  current_version: string;
  entitled: boolean;
}

/** Asset metadata from the registry API. */
export interface AssetMetadata {
  name: string;
  type: 'agent' | 'skill' | 'template' | 'package';
  tier: LicenseTier;
  description: string;
  current_version: string;
  available_versions: string[];
  file_manifest: string[];
}

/** Stub file format deployed into target projects. */
export interface StubFile {
  speckit_stub: true;
  asset: string;
  version: string;
  registry: string;
  ttl: number;
  deployed_at: string;
}

/** Result of resolving a stub (cache hit or registry fetch). */
export interface CacheResult {
  files: Record<string, Buffer>;
  version: string;
  checksum: string;
  from_cache: boolean;
}

/** Constitution principle definition */
export interface ConstitutionPrinciple {
  id: string;
  name: string;
  description: string;
  defaultStatus: PrincipleStatus;
  justification?: string;
}

/** Constitution profile definition */
export interface ConstitutionProfileDef {
  name: string;
  displayName: string;
  description: string;
  principles: Record<string, { status: PrincipleStatus; justification: string }>;
}
