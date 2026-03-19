/**
 * Project Analyzer - Detects language, framework, existing configs, and
 * suggests a constitution profile for the target project.
 */

import path from 'path';
import type { ProjectProfile, ConstitutionProfile, PrincipleStatus } from '../types.js';
import { exists, readJson } from '../utils/file-ops.js';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Analyzes a target project and returns a comprehensive profile.
 */
export async function analyzeProject(targetPath: string): Promise<ProjectProfile> {
  const projectName = path.basename(targetPath);

  const [
    hasGit,
    hasSpecKit,
    hasBeads,
    hasClaude,
    hasMcpInfra,
    language,
    framework,
    testFramework,
    database,
    cicd,
    existingSpecialties,
    existingMcpServers,
  ] = await Promise.all([
    detectGit(targetPath),
    detectSpecKit(targetPath),
    detectBeads(targetPath),
    detectClaude(targetPath),
    detectMcpInfra(targetPath),
    detectLanguage(targetPath),
    detectFramework(targetPath),
    detectTestFramework(targetPath),
    detectDatabase(targetPath),
    detectCicd(targetPath),
    detectExistingSpecialties(targetPath),
    detectExistingMcpServers(targetPath),
  ]);

  const suggestedProfile = suggestProfile(language, framework);
  const principleAdaptations = buildAdaptations(suggestedProfile);

  return {
    projectName,
    projectPath: targetPath,
    language,
    framework,
    hasGit,
    hasSpecKit,
    hasBeads,
    hasClaude,
    hasMcpInfra,
    existingSpecialties,
    existingMcpServers,
    testFramework,
    database,
    cicd,
    suggestedProfile,
    principleAdaptations,
  };
}

async function detectGit(targetPath: string): Promise<boolean> {
  return exists(path.join(targetPath, '.git'));
}

async function detectSpecKit(targetPath: string): Promise<boolean> {
  return exists(path.join(targetPath, '.specify'));
}

async function detectBeads(targetPath: string): Promise<boolean> {
  return exists(path.join(targetPath, '.beads'));
}

async function detectClaude(targetPath: string): Promise<boolean> {
  return exists(path.join(targetPath, '.claude'));
}

async function detectMcpInfra(targetPath: string): Promise<boolean> {
  return exists(path.join(targetPath, '.mcp-infra'));
}

async function detectLanguage(targetPath: string): Promise<string | null> {
  const checks: [string, string][] = [
    ['package.json', 'typescript'],
    ['tsconfig.json', 'typescript'],
    ['requirements.txt', 'python'],
    ['pyproject.toml', 'python'],
    ['Pipfile', 'python'],
    ['go.mod', 'go'],
    ['Cargo.toml', 'rust'],
    ['Gemfile', 'ruby'],
    ['pom.xml', 'java'],
    ['build.gradle', 'java'],
  ];

  for (const [file, lang] of checks) {
    if (await exists(path.join(targetPath, file))) {
      // Distinguish TypeScript from JavaScript
      if (lang === 'typescript') {
        const hasTsConfig = await exists(path.join(targetPath, 'tsconfig.json'));
        const pkg = await readJson<PackageJson>(path.join(targetPath, 'package.json'));
        const hasTsDep = pkg?.devDependencies?.['typescript'] || pkg?.dependencies?.['typescript'];
        return hasTsConfig || hasTsDep ? 'typescript' : 'javascript';
      }
      return lang;
    }
  }
  return null;
}

async function detectFramework(targetPath: string): Promise<string | null> {
  // Check Node.js frameworks
  const pkg = await readJson<PackageJson>(path.join(targetPath, 'package.json'));
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps['next']) return 'nextjs';
    if (allDeps['nuxt']) return 'nuxt';
    if (allDeps['@remix-run/node'] || allDeps['remix']) return 'remix';
    if (allDeps['@sveltejs/kit']) return 'sveltekit';
    if (allDeps['astro']) return 'astro';
    if (allDeps['express']) return 'express';
    if (allDeps['fastify']) return 'fastify';
    if (allDeps['@slack/bolt']) return 'slack-bolt';
    if (allDeps['react'] && !allDeps['next']) return 'react';
    if (allDeps['vue'] && !allDeps['nuxt']) return 'vue';
  }

  // Check Python frameworks
  if (await exists(path.join(targetPath, 'manage.py'))) return 'django';
  const pyProjectExists = await exists(path.join(targetPath, 'pyproject.toml'));
  if (pyProjectExists) {
    // Simple heuristic: check for common patterns
    if (await exists(path.join(targetPath, 'app', 'main.py'))) return 'fastapi';
  }

  return null;
}

async function detectTestFramework(targetPath: string): Promise<string | null> {
  const pkg = await readJson<PackageJson>(path.join(targetPath, 'package.json'));
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps['vitest']) return 'vitest';
    if (allDeps['jest']) return 'jest';
    if (allDeps['mocha']) return 'mocha';
  }

  if (await exists(path.join(targetPath, 'pytest.ini')) ||
      await exists(path.join(targetPath, 'pyproject.toml'))) {
    return 'pytest';
  }

  return null;
}

async function detectDatabase(targetPath: string): Promise<string | null> {
  if (await exists(path.join(targetPath, 'prisma'))) return 'prisma';
  if (await exists(path.join(targetPath, 'drizzle.config.ts'))) return 'drizzle';

  const pkg = await readJson<PackageJson>(path.join(targetPath, 'package.json'));
  if (pkg) {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps['prisma'] || allDeps['@prisma/client']) return 'prisma';
    if (allDeps['drizzle-orm']) return 'drizzle';
    if (allDeps['mongoose']) return 'mongoose';
    if (allDeps['typeorm']) return 'typeorm';
    if (allDeps['sequelize']) return 'sequelize';
    if (allDeps['knex']) return 'knex';
  }

  // Python ORMs
  if (await exists(path.join(targetPath, 'alembic'))) return 'sqlalchemy';

  return null;
}

async function detectCicd(targetPath: string): Promise<string | null> {
  if (await exists(path.join(targetPath, '.github', 'workflows'))) return 'github-actions';
  if (await exists(path.join(targetPath, '.gitlab-ci.yml'))) return 'gitlab-ci';
  if (await exists(path.join(targetPath, 'Jenkinsfile'))) return 'jenkins';
  if (await exists(path.join(targetPath, '.circleci'))) return 'circleci';
  return null;
}

async function detectExistingSpecialties(targetPath: string): Promise<string[]> {
  const skillsDir = path.join(targetPath, '.claude', 'skills');
  if (!(await exists(skillsDir))) return [];

  try {
    const { readdir } = await import('fs/promises');
    const entries = await readdir(skillsDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() || e.name.endsWith('.md'))
      .map((e) => e.name.replace('.md', ''));
  } catch {
    return [];
  }
}

async function detectExistingMcpServers(targetPath: string): Promise<string[]> {
  const mcpConfig = path.join(targetPath, '.mcp.json');
  if (!(await exists(mcpConfig))) return [];

  try {
    const config = await readJson<Record<string, unknown>>(mcpConfig);
    if (config && typeof config === 'object') {
      return Object.keys(config);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

/**
 * Suggests a constitution profile based on detected language and framework.
 */
function suggestProfile(language: string | null, framework: string | null): ConstitutionProfile {
  if (framework === 'slack-bolt') return 'slack-bot';

  if (framework === 'express' || framework === 'fastify') {
    return language === 'typescript' ? 'web-app-typescript' : 'api-service';
  }

  if (['nextjs', 'remix', 'sveltekit', 'astro', 'nuxt', 'react', 'vue'].includes(framework || '')) {
    return language === 'typescript' ? 'web-app-typescript' : 'web-app-typescript';
  }

  if (framework === 'django' || framework === 'fastapi' || language === 'python') {
    return 'web-app-python';
  }

  if (language === 'typescript' || language === 'javascript') {
    return 'web-app-typescript';
  }

  if (language === 'go' || language === 'rust') {
    return 'cli-tool';
  }

  return 'minimal';
}

/**
 * Builds principle adaptations for a given profile.
 * Maps each of the 20 constitution principles to a status.
 */
function buildAdaptations(profile: ConstitutionProfile): Record<string, PrincipleStatus> {
  // Core principles that are PASS for all profiles
  const universal: Record<string, PrincipleStatus> = {
    'VII-deviation-prevention': 'PASS',
    'XI-context-first': 'PASS',
    'XII-confirmation-points': 'PASS',
    'XIII-bounded-loops': 'PASS',
  };

  const profileAdaptations: Record<ConstitutionProfile, Record<string, PrincipleStatus>> = {
    'web-app-typescript': {
      ...universal,
      'I-crm-first': 'N/A',
      'II-plugin-ecosystem': 'PASS',
      'III-api-first': 'PASS',
      'IV-client-isolation': 'PASS',
      'V-soc2-audit': 'PASS',
      'VI-cost-tracking': 'PASS',
      'VIII-token-conservation': 'PASS',
      'IX-structured-tools': 'PASS',
      'X-code-quality': 'PASS',
      'XIV-ui-ux-first': 'PASS',
      'XV-aws-only': 'N/A',
      'XVI-mcp-first': 'PASS',
      'XVII-research-phase': 'PASS',
      'XVIII-validation-phase': 'PASS',
      'XIX-implementation-phase': 'PASS',
      'XX-automation-patterns': 'PASS',
    },
    'web-app-python': {
      ...universal,
      'I-crm-first': 'N/A',
      'II-plugin-ecosystem': 'N/A',
      'III-api-first': 'PASS',
      'IV-client-isolation': 'PASS',
      'V-soc2-audit': 'PASS',
      'VI-cost-tracking': 'PASS',
      'VIII-token-conservation': 'PASS',
      'IX-structured-tools': 'PASS',
      'X-code-quality': 'PASS',
      'XIV-ui-ux-first': 'PASS',
      'XV-aws-only': 'N/A',
      'XVI-mcp-first': 'PASS',
      'XVII-research-phase': 'PASS',
      'XVIII-validation-phase': 'PASS',
      'XIX-implementation-phase': 'PASS',
      'XX-automation-patterns': 'PASS',
    },
    'slack-bot': {
      ...universal,
      'I-crm-first': 'N/A',
      'II-plugin-ecosystem': 'DEVIATION',
      'III-api-first': 'PASS',
      'IV-client-isolation': 'PASS',
      'V-soc2-audit': 'PASS',
      'VI-cost-tracking': 'PASS',
      'VIII-token-conservation': 'PASS',
      'IX-structured-tools': 'PASS',
      'X-code-quality': 'PASS',
      'XIV-ui-ux-first': 'PASS',
      'XV-aws-only': 'PASS',
      'XVI-mcp-first': 'PASS',
      'XVII-research-phase': 'PASS',
      'XVIII-validation-phase': 'PASS',
      'XIX-implementation-phase': 'PASS',
      'XX-automation-patterns': 'PASS',
    },
    'api-service': {
      ...universal,
      'I-crm-first': 'N/A',
      'II-plugin-ecosystem': 'N/A',
      'III-api-first': 'PASS',
      'IV-client-isolation': 'PASS',
      'V-soc2-audit': 'PASS',
      'VI-cost-tracking': 'PASS',
      'VIII-token-conservation': 'PASS',
      'IX-structured-tools': 'PASS',
      'X-code-quality': 'PASS',
      'XIV-ui-ux-first': 'N/A',
      'XV-aws-only': 'N/A',
      'XVI-mcp-first': 'PASS',
      'XVII-research-phase': 'PASS',
      'XVIII-validation-phase': 'PASS',
      'XIX-implementation-phase': 'PASS',
      'XX-automation-patterns': 'PASS',
    },
    'cli-tool': {
      ...universal,
      'I-crm-first': 'N/A',
      'II-plugin-ecosystem': 'N/A',
      'III-api-first': 'PASS',
      'IV-client-isolation': 'N/A',
      'V-soc2-audit': 'N/A',
      'VI-cost-tracking': 'N/A',
      'VIII-token-conservation': 'PASS',
      'IX-structured-tools': 'PASS',
      'X-code-quality': 'PASS',
      'XIV-ui-ux-first': 'N/A',
      'XV-aws-only': 'N/A',
      'XVI-mcp-first': 'PASS',
      'XVII-research-phase': 'PASS',
      'XVIII-validation-phase': 'PASS',
      'XIX-implementation-phase': 'PASS',
      'XX-automation-patterns': 'N/A',
    },
    minimal: {
      ...universal,
      'I-crm-first': 'N/A',
      'II-plugin-ecosystem': 'N/A',
      'III-api-first': 'N/A',
      'IV-client-isolation': 'N/A',
      'V-soc2-audit': 'N/A',
      'VI-cost-tracking': 'N/A',
      'VIII-token-conservation': 'PASS',
      'IX-structured-tools': 'PASS',
      'X-code-quality': 'PASS',
      'XIV-ui-ux-first': 'N/A',
      'XV-aws-only': 'N/A',
      'XVI-mcp-first': 'N/A',
      'XVII-research-phase': 'PASS',
      'XVIII-validation-phase': 'N/A',
      'XIX-implementation-phase': 'PASS',
      'XX-automation-patterns': 'N/A',
    },
  };

  return profileAdaptations[profile] || profileAdaptations['minimal'];
}
