# Data Model: Full Rename — Skills → Specialties, Packages → Teams

**Date**: 2026-03-19
**Status**: Complete

## Overview

No new entities are introduced. This documents the rename mapping for existing TypeScript interfaces and JSON manifest schemas.

## TypeScript Interfaces (deployer/src/types.ts)

### SpecialtyInfo (was SkillInfo)

```typescript
interface SpecialtyInfo {
  name: string;
  description: string;
  hasSpecialtyMd: boolean;  // was hasSkillMd
}
```

### WorkforceTeam (was WorkforcePackage)

```typescript
interface WorkforceTeam {
  name: string;
  version: string;
  description: string;
  agents: string[];
  specialties: string[];     // was skills: string[]
  templates: string[];
  constitutionProfile: ConstitutionProfile;
  security: SecurityLevel;
}
```

### ProjectProfile (field rename)

```typescript
interface ProjectProfile {
  // ... other fields unchanged
  existingSpecialties: string[];  // was existingSkills
}
```

### AgentManifest (field rename)

```typescript
interface AgentManifest {
  // ... other fields unchanged
  requiredSpecialties: string[];  // was requiredSkills
}
```

### DeployOptions (field rename)

```typescript
interface DeployOptions {
  // ... other fields unchanged
  specialties?: string[];  // was skills?: string[]
}
```

### VersionStamp (field rename)

```typescript
interface VersionStamp {
  components: {
    specialties: Record<string, string>;  // was skills
    // ... other fields unchanged
  };
}
```

## Dashboard TypeScript Interfaces (dashboard/src/services/api.ts)

### Specialty (was Skill)

```typescript
interface Specialty {
  name: string;
  description: string;
}
```

### WorkforceTeam (was WorkforcePackage)

```typescript
interface WorkforceTeam {
  name: string;
  version: string;
  description: string;
  agents: string[];
  specialties: string[];  // was skills
  templates: string[];
}
```

### Stats (field renames)

```typescript
interface Stats {
  agents: number;
  specialties: number;  // was skills
  teams: number;        // was packages
  templates: number;
}
```

### SpecialtyWizardInput (was SkillWizardInput)

```typescript
interface SpecialtyWizardInput {
  name: string;
  description: string;
  steps: string[];
}
```

### TeamWizardInput (was PackageWizardInput)

```typescript
interface TeamWizardInput {
  name: string;
  version: string;
  description: string;
  agents: string[];
  specialties: string[];  // was skills
  templates: string[];
}
```

## JSON Manifest Schemas

### Agent manifest.json (4 files)

```json
{
  "name": "executive-assistant",
  "requiredSpecialties": ["calendar-management", "email-drafting"]
}
```

Field rename: `requiredSkills` → `requiredSpecialties`

### Team package.json (3 files, inside Teams/)

```json
{
  "name": "bdr-team",
  "specialties": ["account-research", "email-personalization"]
}
```

Field rename: `skills` → `specialties`

### speckit-version.json

```json
{
  "components": {
    "specialties": {}
  }
}
```

Field rename: `skills` → `specialties`

## Relationships (unchanged)

```
Teams/ directory
  └── team (package.json)
        ├── agents: string[]     → references Agents/ directories
        ├── specialties: string[] → references Specialties/ directories
        └── templates: string[]  → references Templates/ directories

Agents/ directory
  └── agent (manifest.json)
        └── requiredSpecialties: string[] → references Specialties/ directories

Specialties/ directory
  └── specialty (SPECIALTY.md)   → deployed to target .claude/skills/
```

## Validation Rules (unchanged)

- Team `specialties` array entries must match directory names in `Specialties/`
- Agent `requiredSpecialties` array entries must match directory names in `Specialties/`
- Each specialty directory must contain a `SPECIALTY.md` file
