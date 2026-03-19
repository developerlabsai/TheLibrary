/**
 * Dashboard command - launches an Express API server that serves
 * the dashboard frontend and provides REST endpoints for all
 * deployer operations.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { getAllAgents, getAllSkills, getAllTemplates, getAllPackages } from '../registry/asset-registry.js';
import { analyzeProject } from '../analyzers/project-analyzer.js';
import { executeDeploy } from './deploy.js';
import { getProjectRoot } from '../utils/file-ops.js';
import type { ConstitutionProfile, DeployOptions } from '../types.js';

/**
 * Starts the dashboard API server.
 */
export async function startDashboard(port: number = 3847): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Serve static dashboard files
  const dashboardDist = path.join(getProjectRoot(), 'dashboard', 'dist');
  app.use(express.static(dashboardDist));

  // ── API Routes ─────────────────────────────────────────────────

  /** List all agents */
  app.get('/api/agents', async (_req, res) => {
    try {
      const agents = await getAllAgents();
      res.json({ agents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** List all skills */
  app.get('/api/skills', async (_req, res) => {
    try {
      const skills = await getAllSkills();
      res.json({ skills });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** List all templates */
  app.get('/api/templates', async (_req, res) => {
    try {
      const templates = await getAllTemplates();
      res.json({ templates });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** List all workforce packages */
  app.get('/api/packages', async (_req, res) => {
    try {
      const packages = await getAllPackages();
      res.json({ packages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** List all constitution profiles */
  app.get('/api/profiles', (_req, res) => {
    res.json({
      profiles: [
        { name: 'web-app-typescript', description: 'Next.js, Express, React apps' },
        { name: 'web-app-python', description: 'Django, FastAPI, Flask' },
        { name: 'slack-bot', description: 'Slack apps and bots' },
        { name: 'api-service', description: 'REST/GraphQL APIs' },
        { name: 'cli-tool', description: 'CLI utilities and tools' },
        { name: 'minimal', description: 'Lightweight, any project' },
      ],
    });
  });

  /** Get summary stats */
  app.get('/api/stats', async (_req, res) => {
    try {
      const [agents, skills, templates, packages] = await Promise.all([
        getAllAgents(),
        getAllSkills(),
        getAllTemplates(),
        getAllPackages(),
      ]);
      res.json({
        agents: agents.length,
        skills: skills.length,
        templates: templates.length,
        packages: packages.length,
        profiles: 6,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** Analyze a target project */
  app.post('/api/analyze', async (req, res) => {
    try {
      const { targetPath } = req.body;
      if (!targetPath) {
        res.status(400).json({ error: 'targetPath is required' });
        return;
      }
      const profile = await analyzeProject(targetPath);
      res.json({ profile });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** Deploy SpecKit into a target project */
  app.post('/api/deploy', async (req, res) => {
    try {
      const options: DeployOptions = {
        targetPath: req.body.targetPath,
        profile: req.body.profile as ConstitutionProfile,
        skills: req.body.skills,
        agents: req.body.agents,
        templates: req.body.templates,
        security: req.body.security,
        dryRun: req.body.dryRun,
      };

      if (!options.targetPath) {
        res.status(400).json({ error: 'targetPath is required' });
        return;
      }

      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.map(String).join(' '));
      };

      await executeDeploy(options);

      console.log = originalLog;

      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Validation Helpers ──────────────────────────────────────────

  /**
   * Validates that required fields are present in the request body.
   * Returns an error message string if validation fails, null if valid.
   */
  function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
    const missing = fields.filter((f) => !body[f] || (typeof body[f] === 'string' && !(body[f] as string).trim()));
    if (missing.length > 0) {
      return `Missing required fields: ${missing.join(', ')}`;
    }
    return null;
  }

  // ── Wizard API Routes ───────────────────────────────────────────

  /** Create an agent via wizard input */
  app.post('/api/wizards/agent', async (req, res) => {
    try {
      const error = validateRequired(req.body, ['name', 'displayName', 'purpose', 'tone']);
      if (error) { res.status(400).json({ error }); return; }
      const { generateAgent } = await import('../wizards/agent-wizard.js');
      const outputDir = await generateAgent(req.body);
      res.json({ success: true, outputDir });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** Create a skill via wizard input */
  app.post('/api/wizards/skill', async (req, res) => {
    try {
      const error = validateRequired(req.body, ['name', 'displayName', 'description', 'invocationCommand']);
      if (error) { res.status(400).json({ error }); return; }
      const { generateSkill } = await import('../wizards/skill-wizard.js');
      const outputDir = await generateSkill(req.body);
      res.json({ success: true, outputDir });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** Create an MCP server via wizard input */
  app.post('/api/wizards/mcp', async (req, res) => {
    try {
      const error = validateRequired(req.body, ['name', 'displayName', 'apiBaseUrl', 'authType']);
      if (error) { res.status(400).json({ error }); return; }
      // Validate burstLimit <= requestsPerMinute if rate limits provided
      const rl = req.body.rateLimits;
      if (rl && typeof rl === 'object' && 'burstLimit' in rl && 'maxRequests' in rl) {
        if (Number(rl.burstLimit) > Number(rl.maxRequests)) {
          res.status(400).json({ error: 'burstLimit must be <= maxRequests (requestsPerMinute)' });
          return;
        }
      }
      const { generateMcpServer } = await import('../wizards/mcp-wizard.js');
      const outputDir = await generateMcpServer(req.body);
      res.json({ success: true, outputDir });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** Create a feature spec via wizard input */
  app.post('/api/wizards/feature', async (req, res) => {
    try {
      const error = validateRequired(req.body, ['name', 'description']);
      if (error) { res.status(400).json({ error }); return; }
      const { generateFeatureSpec } = await import('../wizards/feature-wizard.js');
      const outputDir = await generateFeatureSpec(req.body);
      res.json({ success: true, outputDir });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /** Create a workforce package via wizard input */
  app.post('/api/wizards/package', async (req, res) => {
    try {
      const error = validateRequired(req.body, ['name', 'description']);
      if (error) { res.status(400).json({ error }); return; }
      const { generatePackage } = await import('../wizards/package-wizard.js');
      const outputDir = await generatePackage(req.body);
      res.json({ success: true, outputDir });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SPA fallback - serve index.html for any unmatched routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dashboardDist, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`\n  TheLibrary Dashboard`);
    console.log(`  http://localhost:${port}\n`);
  });
}
