# Dashboard API Contract

**Base URL**: `http://localhost:3847/api`
**Content-Type**: `application/json`

## Asset Endpoints

### GET /api/agents
Returns all agents from the library.

**Response** `200`:
```json
{
  "agents": [
    {
      "name": "executive-assistant",
      "displayName": "Executive Assistant",
      "version": "1.0.0",
      "description": "High-trust EA agent...",
      "requiredSkills": ["calendar-prep", "call-prep"],
      "tags": ["executive", "productivity"]
    }
  ]
}
```

### GET /api/skills
Returns all skills from the library.

**Response** `200`:
```json
{
  "skills": [
    {
      "name": "account-research",
      "displayName": "Account Research",
      "version": "1.0.0",
      "description": "Generates comprehensive account research...",
      "hasReference": true
    }
  ]
}
```

### GET /api/templates
Returns all template filenames.

**Response** `200`:
```json
{
  "templates": ["sales-bdr-playbook.html", "template-proposal-sow.html"]
}
```

### GET /api/packages
Returns all workforce packages.

**Response** `200`:
```json
{
  "packages": [
    {
      "name": "bdr-team",
      "description": "Complete BDR team workforce...",
      "version": "1.0.0",
      "agents": ["executive-assistant", "chief-of-staff"],
      "skills": ["account-research", "call-prep"],
      "templates": ["sales-bdr-playbook.html"],
      "security": true
    }
  ]
}
```

### GET /api/profiles
Returns available constitution profiles.

**Response** `200`:
```json
{
  "profiles": [
    { "name": "web-app-typescript", "description": "Next.js, Express, React apps" }
  ]
}
```

### GET /api/stats
Returns summary counts.

**Response** `200`:
```json
{
  "agents": 4,
  "skills": 21,
  "templates": 10,
  "packages": 3,
  "profiles": 6
}
```

## Operation Endpoints

### POST /api/analyze
Analyzes a target project.

**Request**:
```json
{ "targetPath": "/path/to/project" }
```

**Response** `200`:
```json
{
  "profile": {
    "projectName": "my-project",
    "projectPath": "/path/to/project",
    "language": "typescript",
    "framework": "nextjs",
    "hasGit": true,
    "hasSpecKit": false,
    "hasBeads": false,
    "hasClaude": true,
    "hasMcpInfra": false,
    "suggestedProfile": "web-app-typescript",
    "existingSkills": []
  }
}
```

**Error** `400`: `{ "error": "targetPath is required" }`

### POST /api/deploy
Deploys SpecKit into a target project.

**Request**:
```json
{
  "targetPath": "/path/to/project",
  "profile": "web-app-typescript",
  "skills": ["account-research", "call-prep"],
  "agents": ["executive-assistant"],
  "templates": ["sales-bdr-playbook.html"],
  "security": true,
  "dryRun": false
}
```

**Response** `200`:
```json
{
  "success": true,
  "logs": [
    "Step 1: Analyzing target project...",
    "Step 2: Deploying SpecKit structure..."
  ]
}
```

## Wizard Endpoints

### POST /api/wizards/agent
Creates an agent from wizard input.

**Request**: AgentWizardInput (see data-model.md Agent entity)
**Response** `200`: `{ "success": true, "outputDir": "/path/to/Agents/name" }`

### POST /api/wizards/skill
Creates a skill from wizard input.

**Request**: SkillWizardInput (see data-model.md Skill entity)
**Response** `200`: `{ "success": true, "outputDir": "/path/to/Skills/name" }`

### POST /api/wizards/mcp
Creates an MCP server from wizard input.

**Request**: McpWizardInput (see data-model.md MCP Server entity)
**Response** `200`: `{ "success": true, "outputDir": "/path/to/MCP-Servers/name" }`

### POST /api/wizards/feature
Creates a feature spec from wizard input.

**Request**: FeatureWizardInput (see data-model.md Feature Spec entity)
**Response** `200`: `{ "success": true, "outputDir": "/path/to/Features/branchName" }`

### POST /api/wizards/package
Creates a workforce package from wizard input.

**Request**: PackageWizardInput (see data-model.md Workforce Package entity)
**Response** `200`: `{ "success": true, "outputDir": "/path/to/Packages/name" }`

## Error Handling

All endpoints return errors in the format:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Missing required fields |
| 500 | Internal error (file system, generation failure) |
