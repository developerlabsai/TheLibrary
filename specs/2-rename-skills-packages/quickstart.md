# Quickstart Verification: Full Rename

**Date**: 2026-03-19

## Pre-flight Checks

Before starting, confirm:

- [ ] On feature branch `2-rename-skills-packages` (or working branch)
- [ ] `Skills/` directory exists (will be renamed)
- [ ] `Packages/` directory exists (will be renamed)
- [ ] `cd deployer && npm install` — dependencies installed
- [ ] `cd dashboard && npm install` — dependencies installed

## Phase Checkpoints

### After Phase 1 (Directory & File Renames)

```bash
# Verify directories renamed
ls Specialties/    # should list ~21 subdirectories
ls Teams/          # should list bdr-team, executive-ops, engineering-team
ls Skills/ 2>&1    # should fail: "No such file or directory"
ls Packages/ 2>&1  # should fail: "No such file or directory"

# Verify SPECIALTY.md files
find Specialties -name "SPECIALTY.md" | wc -l   # should be 21
find Specialties -name "SKILL.md" | wc -l       # should be 0
```

### After Phase 4 (Deployer Complete)

```bash
cd deployer && npx tsc --noEmit
# Expected: 0 errors
```

### After Phase 6 (Dashboard Complete)

```bash
cd dashboard && npx vite build
# Expected: build succeeds
```

### After Phase 7 (JSON Manifests)

```bash
# Verify agent manifests
grep -l "requiredSpecialties" Agents/*/manifest.json | wc -l  # should be 4
grep -l "requiredSkills" Agents/*/manifest.json | wc -l       # should be 0

# Verify team manifests
grep -l '"specialties"' Teams/*/package.json | wc -l  # should be 3
grep -l '"skills"' Teams/*/package.json | wc -l       # should be 0
```

### After Phase 9 (Final Verification)

```bash
# 1. TypeScript compilation
cd deployer && npx tsc --noEmit
# Expected: 0 errors

# 2. Dashboard build
cd dashboard && npx vite build
# Expected: build succeeds

# 3. CLI list command
cd deployer && npx tsx bin/speckit.ts list
# Expected: output shows "Specialties" and "Teams" headings

# 4. Grep for remaining "skill" references (excluding allowed patterns)
grep -ri "skill" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" \
  --exclude-dir=node_modules --exclude-dir=specs --exclude-dir=.claude \
  deployer/ dashboard/ Specialties/ Teams/ Agents/ CLAUDE.md
# Expected: 0 matches (or only .claude/skills/ target path references)

# 5. Grep for remaining workforce "package" references
grep -ri "package" --include="*.ts" --include="*.tsx" --include="*.md" \
  --exclude-dir=node_modules --exclude-dir=specs \
  deployer/src/ dashboard/src/ | grep -iv "package\.json\|npm\|node_modules\|import.*from"
# Expected: 0 matches referring to workforce packages

# 6. Verify SPECIALTY.md count
find Specialties -name "SPECIALTY.md" | wc -l
# Expected: 21

# 7. Verify manifest fields
grep -c "requiredSpecialties" Agents/*/manifest.json
# Expected: 4 files, each with count >= 1

# 8. Verify team manifest fields
grep -c '"specialties"' Teams/*/package.json
# Expected: 3 files, each with count >= 1
```

## Success Criteria Summary

| # | Criterion | Command | Expected |
|---|-----------|---------|----------|
| 1 | TypeScript compiles | `cd deployer && npx tsc --noEmit` | 0 errors |
| 2 | Dashboard builds | `cd dashboard && npx vite build` | Success |
| 3 | CLI shows new terms | `speckit list` | "Specialties" + "Teams" |
| 4 | No stale "skill" refs | grep scan | 0 unexpected matches |
| 5 | No stale "package" refs | grep scan | 0 unexpected matches |
| 6 | SPECIALTY.md files | find count | 21 |
| 7 | Agent manifests | grep `requiredSpecialties` | 4 files |
| 8 | Team manifests | grep `specialties` | 3 files |
