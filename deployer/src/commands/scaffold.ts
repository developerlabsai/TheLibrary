/**
 * Scaffold command - creates a new project directory with language-appropriate
 * structure, git initialization, and a pre-installed SpecKit deployment.
 */

import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { ensureDir, writeText, writeJson } from '../utils/file-ops.js';
import { executeDeploy } from './deploy.js';
import type { ConstitutionProfile } from '../types.js';

/** Supported languages for scaffolding */
type ScaffoldLanguage = 'typescript' | 'python' | 'go' | 'rust';

/** Map of language aliases to canonical language names */
const LANGUAGE_ALIASES: Record<string, ScaffoldLanguage> = {
  ts: 'typescript',
  typescript: 'typescript',
  javascript: 'typescript',
  js: 'typescript',
  python: 'python',
  py: 'python',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
};

/** Default constitution profiles per language */
const DEFAULT_PROFILES: Record<ScaffoldLanguage, ConstitutionProfile> = {
  typescript: 'web-app-typescript',
  python: 'web-app-python',
  go: 'api-service',
  rust: 'cli-tool',
};

/**
 * Scaffolds a new project directory with language-appropriate structure,
 * git initialization, and a pre-installed SpecKit deployment.
 *
 * @param targetPath - Absolute or relative path for the new project directory.
 * @param options.language - Language for the project (typescript, python, go, rust).
 *   Aliases like "ts", "py", "rs" are accepted. Defaults to "typescript".
 * @param options.profile - Constitution profile to deploy. If omitted, a
 *   sensible default is chosen based on the language.
 * @param options.security - Whether to include the security baseline deployment.
 */
export async function executeScaffold(
  targetPath: string,
  options: {
    language?: string;
    profile?: string;
    security?: boolean;
  }
): Promise<void> {
  const resolvedPath = path.resolve(targetPath);
  const projectName = path.basename(resolvedPath);

  console.log(chalk.bold('\n  TheLibrary - Scaffold New Project\n'));

  // --- Validate target directory does not already exist ---
  if (await fs.pathExists(resolvedPath)) {
    console.log(chalk.red(`  Directory already exists: ${resolvedPath}`));
    console.log(chalk.dim('  Choose a different path or remove the existing directory.'));
    return;
  }

  // --- Resolve language ---
  const rawLang = (options.language ?? 'typescript').toLowerCase();
  const language = LANGUAGE_ALIASES[rawLang];
  if (!language) {
    console.log(chalk.red(`  Unsupported language: "${options.language}"`));
    console.log(chalk.dim(`  Supported: typescript, python, go, rust`));
    return;
  }

  // --- Resolve constitution profile ---
  const profile = (options.profile as ConstitutionProfile) ?? DEFAULT_PROFILES[language];

  console.log(chalk.blue(`  Project:  ${projectName}`));
  console.log(chalk.blue(`  Path:     ${resolvedPath}`));
  console.log(chalk.blue(`  Language: ${language}`));
  console.log(chalk.blue(`  Profile:  ${profile}`));
  console.log('');

  // Step 1: Create project directory
  console.log(chalk.blue('  Step 1: Creating project directory...'));
  await ensureDir(resolvedPath);
  console.log(chalk.green(`    Created ${resolvedPath}`));

  // Step 2: Initialize git repository
  console.log(chalk.blue('\n  Step 2: Initializing git repository...'));
  try {
    execSync('git init', { cwd: resolvedPath, stdio: 'pipe' });
    console.log(chalk.green('    Initialized empty git repository'));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.yellow(`    Warning: git init failed - ${message}`));
    console.log(chalk.dim('    Continuing without git initialization.'));
  }

  // Step 3: Create language-appropriate package manifest
  console.log(chalk.blue('\n  Step 3: Creating package manifest...'));
  await createPackageManifest(resolvedPath, projectName, language);

  // Step 4: Create recommended directory structure
  console.log(chalk.blue('\n  Step 4: Creating directory structure...'));
  await createDirectoryStructure(resolvedPath, language);

  // Step 5: Create .gitignore
  console.log(chalk.blue('\n  Step 5: Creating .gitignore...'));
  const gitignoreContent = generateGitignore(language);
  await writeText(path.join(resolvedPath, '.gitignore'), gitignoreContent);
  console.log(chalk.green('    Created .gitignore'));

  // Step 6: Deploy SpecKit
  console.log(chalk.blue('\n  Step 6: Installing SpecKit...\n'));
  await executeDeploy({
    targetPath: resolvedPath,
    profile,
    security: options.security ?? false,
    scaffold: true,
  });

  // Final summary
  console.log(chalk.bold.green('\n  Scaffold complete!'));
  console.log(chalk.dim(`  Project: ${projectName}`));
  console.log(chalk.dim(`  Path:    ${resolvedPath}`));
  console.log(chalk.dim(`\n  Next steps:`));
  console.log(chalk.dim(`    cd ${resolvedPath}`));
  if (language === 'typescript') {
    console.log(chalk.dim('    npm install'));
  } else if (language === 'python') {
    console.log(chalk.dim('    pip install -r requirements.txt'));
  } else if (language === 'go') {
    console.log(chalk.dim('    go mod tidy'));
  } else if (language === 'rust') {
    console.log(chalk.dim('    cargo build'));
  }
  console.log('');
}

/**
 * Creates the language-appropriate package manifest files in the project root.
 *
 * @param projectPath - Absolute path to the project directory.
 * @param projectName - Name of the project (used in manifest metadata).
 * @param language - Canonical language identifier.
 */
async function createPackageManifest(
  projectPath: string,
  projectName: string,
  language: ScaffoldLanguage
): Promise<void> {
  switch (language) {
    case 'typescript': {
      await createTypescriptManifest(projectPath, projectName);
      break;
    }
    case 'python': {
      await createPythonManifest(projectPath, projectName);
      break;
    }
    case 'go': {
      await createGoManifest(projectPath, projectName);
      break;
    }
    case 'rust': {
      await createRustManifest(projectPath, projectName);
      break;
    }
  }
}

/**
 * Creates package.json and tsconfig.json for a TypeScript project.
 */
async function createTypescriptManifest(
  projectPath: string,
  projectName: string
): Promise<void> {
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    description: '',
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch',
      start: 'node dist/index.js',
      test: 'node --test',
      lint: 'tsc --noEmit',
    },
    devDependencies: {
      typescript: '^5.4.0',
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  await writeJson(path.join(projectPath, 'package.json'), packageJson);
  console.log(chalk.green('    Created package.json'));

  await writeJson(path.join(projectPath, 'tsconfig.json'), tsconfig);
  console.log(chalk.green('    Created tsconfig.json'));
}

/**
 * Creates requirements.txt and pyproject.toml for a Python project.
 */
async function createPythonManifest(
  projectPath: string,
  projectName: string
): Promise<void> {
  const pyprojectToml = `[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "${projectName}"
version = "0.1.0"
description = ""
requires-python = ">=3.11"
dependencies = []

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "ruff>=0.3.0",
    "mypy>=1.8.0",
]

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.mypy]
python_version = "3.11"
strict = true
`;

  const requirementsTxt = `# Production dependencies
# Add your dependencies here, one per line

# Development dependencies are defined in pyproject.toml [project.optional-dependencies.dev]
`;

  await writeText(path.join(projectPath, 'pyproject.toml'), pyprojectToml);
  console.log(chalk.green('    Created pyproject.toml'));

  await writeText(path.join(projectPath, 'requirements.txt'), requirementsTxt);
  console.log(chalk.green('    Created requirements.txt'));
}

/**
 * Creates go.mod for a Go project.
 */
async function createGoManifest(
  projectPath: string,
  projectName: string
): Promise<void> {
  const goMod = `module ${projectName}

go 1.22

require ()
`;

  await writeText(path.join(projectPath, 'go.mod'), goMod);
  console.log(chalk.green('    Created go.mod'));
}

/**
 * Creates Cargo.toml for a Rust project.
 */
async function createRustManifest(
  projectPath: string,
  projectName: string
): Promise<void> {
  const cargoToml = `[package]
name = "${projectName}"
version = "0.1.0"
edition = "2021"
description = ""

[dependencies]

[dev-dependencies]
`;

  await writeText(path.join(projectPath, 'Cargo.toml'), cargoToml);
  console.log(chalk.green('    Created Cargo.toml'));
}

/**
 * Creates the recommended directory structure for the given language.
 *
 * @param projectPath - Absolute path to the project directory.
 * @param language - Canonical language identifier.
 */
async function createDirectoryStructure(
  projectPath: string,
  language: ScaffoldLanguage
): Promise<void> {
  switch (language) {
    case 'typescript': {
      await ensureDir(path.join(projectPath, 'src'));
      await writeText(
        path.join(projectPath, 'src', 'index.ts'),
        '/**\n * Application entry point.\n */\n\nconsole.log(\'Hello from SpecKit!\');\n'
      );
      console.log(chalk.green('    Created src/index.ts'));

      await ensureDir(path.join(projectPath, 'test'));
      await writeText(
        path.join(projectPath, 'test', 'index.test.ts'),
        'import { describe, it } from \'node:test\';\nimport assert from \'node:assert/strict\';\n\ndescribe(\'example\', () => {\n  it(\'should pass\', () => {\n    assert.strictEqual(1 + 1, 2);\n  });\n});\n'
      );
      console.log(chalk.green('    Created test/index.test.ts'));
      break;
    }

    case 'python': {
      await ensureDir(path.join(projectPath, 'src'));
      await writeText(
        path.join(projectPath, 'src', '__init__.py'),
        '"""Application package."""\n'
      );
      await writeText(
        path.join(projectPath, 'src', 'main.py'),
        '"""Application entry point."""\n\n\ndef main() -> None:\n    """Run the application."""\n    print("Hello from SpecKit!")\n\n\nif __name__ == "__main__":\n    main()\n'
      );
      console.log(chalk.green('    Created src/__init__.py'));
      console.log(chalk.green('    Created src/main.py'));

      await ensureDir(path.join(projectPath, 'tests'));
      await writeText(
        path.join(projectPath, 'tests', '__init__.py'),
        '"""Test package."""\n'
      );
      await writeText(
        path.join(projectPath, 'tests', 'test_main.py'),
        '"""Tests for main module."""\n\nfrom src.main import main\n\n\ndef test_main(capsys) -> None:\n    """Test that main prints the expected output."""\n    main()\n    captured = capsys.readouterr()\n    assert "Hello from SpecKit!" in captured.out\n'
      );
      console.log(chalk.green('    Created tests/__init__.py'));
      console.log(chalk.green('    Created tests/test_main.py'));
      break;
    }

    case 'go': {
      await ensureDir(path.join(projectPath, 'cmd'));
      await writeText(
        path.join(projectPath, 'cmd', 'main.go'),
        'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello from SpecKit!")\n}\n'
      );
      console.log(chalk.green('    Created cmd/main.go'));

      await ensureDir(path.join(projectPath, 'internal'));
      await writeText(
        path.join(projectPath, 'internal', '.gitkeep'),
        ''
      );
      console.log(chalk.green('    Created internal/'));

      await ensureDir(path.join(projectPath, 'pkg'));
      await writeText(
        path.join(projectPath, 'pkg', '.gitkeep'),
        ''
      );
      console.log(chalk.green('    Created pkg/'));
      break;
    }

    case 'rust': {
      await ensureDir(path.join(projectPath, 'src'));
      await writeText(
        path.join(projectPath, 'src', 'main.rs'),
        '/// Application entry point.\nfn main() {\n    println!("Hello from SpecKit!");\n}\n'
      );
      console.log(chalk.green('    Created src/main.rs'));

      await ensureDir(path.join(projectPath, 'tests'));
      await writeText(
        path.join(projectPath, 'tests', 'integration_test.rs'),
        '#[test]\nfn it_works() {\n    assert_eq!(2 + 2, 4);\n}\n'
      );
      console.log(chalk.green('    Created tests/integration_test.rs'));
      break;
    }
  }
}

/**
 * Generates a language-appropriate .gitignore file.
 *
 * @param language - Canonical language identifier.
 * @returns The .gitignore file content.
 */
function generateGitignore(language: ScaffoldLanguage): string {
  const common = `# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local
.env.*.local
`;

  switch (language) {
    case 'typescript':
      return `${common}
# Node
node_modules/
dist/
*.tsbuildinfo

# Logs
*.log
npm-debug.log*

# Coverage
coverage/
`;

    case 'python':
      return `${common}
# Python
__pycache__/
*.py[cod]
*$py.class
*.egg-info/
dist/
build/
*.egg

# Virtual environments
.venv/
venv/
env/

# Testing
.pytest_cache/
.coverage
htmlcov/

# Type checking
.mypy_cache/
`;

    case 'go':
      return `${common}
# Go
bin/
vendor/

# Build output
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary
*.test

# Coverage
coverage.out
`;

    case 'rust':
      return `${common}
# Rust
target/
Cargo.lock

# Debug
*.pdb
`;
  }
}
