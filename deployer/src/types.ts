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
  existingSkills: string[];
  existingMcpServers: string[];
  testFramework: string | null;
  database: string | null;
  cicd: string | null;
  suggestedProfile: ConstitutionProfile;
  principleAdaptations: Record<string, PrincipleStatus>;
}

/** Agent manifest stored alongside each agent definition */
export interface AgentManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  files: Record<string, string>;
  requiredSkills: string[];
  requiredMcp: string[];
  tags: string[];
}

/** Skill manifest (derived from SKILL.md front matter) */
export interface SkillInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  directory: string;
  hasReference: boolean;
  requiredMcp: string[];
}

/** Workforce package definition */
export interface WorkforcePackage {
  name: string;
  description: string;
  version: string;
  agents: string[];
  skills: string[];
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
    skills: Record<string, string>;
    agents: Record<string, string>;
    templates: string[];
  };
}

/** Deploy options passed to the deploy command */
export interface DeployOptions {
  targetPath: string;
  profile?: ConstitutionProfile;
  skills?: string[];
  agents?: string[];
  templates?: string[];
  security?: boolean;
  dryRun?: boolean;
  force?: boolean;
  scaffold?: boolean;
}

/** MCP creation options */
export interface McpCreateOptions {
  name: string;
  fromOpenapi?: string;
  fromUrl?: string;
  fromManual?: boolean;
  outputDir?: string;
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
