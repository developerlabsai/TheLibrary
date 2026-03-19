# API Contract Renames

**Date**: 2026-03-19
**Server**: `deployer/src/commands/dashboard.ts` (Express)
**Client**: `dashboard/src/services/api.ts` (fetch wrapper)

## Endpoint Rename Map

No new endpoints are added. Existing endpoints are renamed:

### GET /api/specialties (was /api/skills)

**Response**: `Specialty[]` (was `Skill[]`)

```json
[
  { "name": "Account Research", "description": "..." },
  { "name": "Email Personalization", "description": "..." }
]
```

### GET /api/teams (was /api/packages)

**Response**: `WorkforceTeam[]` (was `WorkforcePackage[]`)

```json
[
  {
    "name": "bdr-team",
    "version": "1.0.0",
    "description": "...",
    "agents": ["executive-assistant"],
    "specialties": ["account-research"],
    "templates": []
  }
]
```

### POST /api/wizards/specialty (was /api/wizards/skill)

**Request**: `SpecialtyWizardInput` (was `SkillWizardInput`)

```json
{
  "name": "New Specialty",
  "description": "...",
  "steps": ["Step 1", "Step 2"]
}
```

**Response**: `{ success: boolean, path: string }`

### POST /api/wizards/team (was /api/wizards/package)

**Request**: `TeamWizardInput` (was `PackageWizardInput`)

```json
{
  "name": "new-team",
  "version": "1.0.0",
  "description": "...",
  "agents": [],
  "specialties": [],
  "templates": []
}
```

**Response**: `{ success: boolean, path: string }`

## CLI Command Rename Map

| Old Command | New Command |
|-------------|-------------|
| `speckit deploy --skills a,b` | `speckit deploy --specialties a,b` |
| `speckit deploy-skill <path> <name>` | `speckit deploy-specialty <path> <name>` |
| `speckit create-skill` | `speckit create-specialty` |
| `speckit create-package` | `speckit create-team` |
| `speckit bundle <path> <package>` | `speckit bundle <path> <team>` |
| `speckit list skills` | `speckit list specialties` |
| `speckit list packages` | `speckit list teams` |

## Dashboard Route Rename Map

| Old Route | New Route | Component |
|-----------|-----------|-----------|
| `/packages` | `/teams` | `Teams` (was `Packages`) |
| `/create/skill` | `/create/specialty` | `CreateSpecialty` (was `CreateSkill`) |
| `/create/package` | `/create/team` | `CreateTeam` (was `CreatePackage`) |
