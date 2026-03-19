# TheLibrary - Project Rules

## Architecture

- **TheLibrary** is a deployment platform for SpecKit, Beads, Agents, Specialties, MCP Servers, and Templates
- `deployer/` contains the CLI (TypeScript, Commander.js)
- `dashboard/` contains the web UI (React 19, Vite, Tailwind)
- `library/` contains canonical source files deployed into target projects
- `Agents/`, `Specialties/`, `Templates/`, `Teams/` are the asset library

## Development Rules

### CLI Development
- Entry point: `deployer/bin/speckit.ts`
- Run with: `cd deployer && npx tsx bin/speckit.ts <command>`
- Type check: `cd deployer && npx tsc --noEmit`
- All commands use dynamic imports for lazy loading

### Dashboard Development
- Build: `cd dashboard && npx vite build`
- Dashboard is served by the Express API in `deployer/src/commands/dashboard.ts`
- API runs on port 3847 by default
- Always rebuild dashboard after frontend changes

### Wizard Pattern
- Every wizard has dual entry: CLI (`run*WizardCli`) and API (`generate*`)
- CLI uses `deployer/src/wizards/prompt-engine.ts` for interactive prompts
- Dashboard calls the `generate*` functions via POST to `/api/wizards/*`

## Merge Safety (CRITICAL)

When deploying into target projects:
- **NEVER overwrite** `constitution.md` - offer merge
- **NEVER remove** existing permissions from `settings.local.json` - only add
- **NEVER touch** existing `specs/` content
- **Skip** assets that already exist (specialties, agents, beads)

## Git Workflow
- Use SpecKit feature workflow for new features
- Feature specs go in `specs/` or `Features/`
- Run `speckit create-feature` to scaffold a new feature spec
