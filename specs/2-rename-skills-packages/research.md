# Research: Full Rename — Skills → Specialties, Packages → Teams

**Date**: 2026-03-19
**Status**: Complete — no unknowns

## Summary

This is a mechanical terminology rename across an existing codebase. No new technologies, patterns, or integrations are introduced. All unknowns were resolved during the double codebase audit performed before spec creation.

## Decisions

### 1. Rename Scope

- **Decision**: Full rename (types, functions, variables, files, directories, endpoints, CLI commands, UI text, JSON fields, docs)
- **Rationale**: Cosmetic-only rename creates a JSON/TypeScript sync trap — if JSON manifest fields rename but TypeScript interfaces don't, the code can't read the JSON correctly
- **Alternatives considered**: Cosmetic-only (UI text + directory paths) — rejected due to sync trap risk

### 2. Migration Strategy

- **Decision**: Clean break, no backward-compatible aliases
- **Rationale**: Single-operator internal platform tool. Aliases add maintenance burden and perpetuate the terminology confusion this rename is meant to solve
- **Alternatives considered**: Hidden aliases with deprecation warnings — rejected as unnecessary overhead

### 3. `.claude/skills/` Target Path

- **Decision**: Keep as-is (do not rename to `.claude/specialties/`)
- **Rationale**: This is Claude Code's convention for the deployment target directory. Renaming it would break compatibility with Claude Code's native skill system
- **Alternatives considered**: Rename to `.claude/specialties/` — rejected to maintain Claude Code compatibility

### 4. Execution Order

- **Decision**: Types-first, then consumers (deployer before dashboard)
- **Rationale**: Updating `types.ts` first lets TypeScript's compiler flag any missed references in consumer files. Deployer before dashboard because the dashboard API client depends on the deployer's Express API endpoints
- **Alternatives considered**: File-by-file alphabetical — rejected because it doesn't leverage TypeScript's type checker for validation

### 5. Verification Strategy

- **Decision**: Compiler checks + exhaustive grep scan
- **Rationale**: `tsc --noEmit` catches type errors, `vite build` catches dashboard errors, grep catches string literals and comments that compilers miss
- **Alternatives considered**: Manual review only — rejected as error-prone for 31+ files
