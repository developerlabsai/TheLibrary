/**
 * Safe file operations for the deployer.
 * Handles copying, merging, and directory creation with safety checks.
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * Ensures a directory exists, creating it recursively if needed.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Copies a file only if the destination does not already exist.
 * Returns true if copied, false if skipped.
 */
export async function copyIfNotExists(src: string, dest: string): Promise<boolean> {
  if (await fs.pathExists(dest)) {
    return false;
  }
  await fs.ensureDir(path.dirname(dest));
  await fs.copy(src, dest);
  return true;
}

/**
 * Copies a file, overwriting if it exists.
 */
export async function copyForce(src: string, dest: string): Promise<void> {
  await fs.ensureDir(path.dirname(dest));
  await fs.copy(src, dest, { overwrite: true });
}

/**
 * Copies an entire directory recursively.
 * If dest exists, merges (new files added, existing files NOT overwritten).
 */
export async function copyDirMerge(srcDir: string, destDir: string): Promise<{ copied: string[]; skipped: string[] }> {
  const copied: string[] = [];
  const skipped: string[] = [];

  if (!(await fs.pathExists(srcDir))) {
    return { copied, skipped };
  }

  await fs.ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      const subResult = await copyDirMerge(srcPath, destPath);
      copied.push(...subResult.copied);
      skipped.push(...subResult.skipped);
    } else {
      if (await fs.pathExists(destPath)) {
        skipped.push(destPath);
      } else {
        await fs.copy(srcPath, destPath);
        copied.push(destPath);
      }
    }
  }

  return { copied, skipped };
}

/**
 * Merges JSON objects: adds new keys from source, never removes existing keys.
 */
export function mergeJson(existing: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, unknown> {
  const result = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (!(key in result)) {
      result[key] = value;
    } else if (Array.isArray(result[key]) && Array.isArray(value)) {
      const existingArr = result[key] as unknown[];
      const newItems = (value as unknown[]).filter(
        (item) => !existingArr.includes(item)
      );
      result[key] = [...existingArr, ...newItems];
    } else if (
      typeof result[key] === 'object' &&
      result[key] !== null &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = mergeJson(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    }
    // If key exists and is not object/array, keep existing (never overwrite)
  }

  return result;
}

/**
 * Reads a JSON file, returns null if it doesn't exist.
 */
export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return await fs.readJson(filePath);
  } catch {
    return null;
  }
}

/**
 * Writes a JSON file with pretty formatting.
 */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Checks if a path exists.
 */
export async function exists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

/**
 * Reads a text file, returns null if it doesn't exist.
 */
export async function readText(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Writes a text file, creating directories as needed.
 */
export async function writeText(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Returns the deployer's library root path.
 */
export function getLibraryRoot(): string {
  return path.resolve(import.meta.dirname, '..', '..', '..', 'library');
}

/**
 * Returns the Agent Creator project root.
 */
export function getProjectRoot(): string {
  return path.resolve(import.meta.dirname, '..', '..', '..');
}
