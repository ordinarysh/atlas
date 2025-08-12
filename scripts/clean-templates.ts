#!/usr/bin/env tsx
/**
 * Template Cleanup Script
 *
 * Removes all build artifacts and machine-specific files from template directories
 * before packaging for release. This ensures templates are clean and portable.
 *
 * Usage: pnpm clean:templates
 */

import { rm, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import pc from "picocolors";
import glob from "fast-glob";

// Artifacts to remove from templates
const ARTIFACTS_TO_REMOVE = {
  directories: [
    "node_modules",
    ".pnpm-store",
    "dist",
    ".next",
    ".turbo",
    "coverage",
    "playwright-report",
    ".vite",
    ".cache",
    "build",
    ".vercel",
    ".netlify",
    "out",
  ],
  files: [
    "*.tsbuildinfo",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    "*.log",
    "*.pid",
    "*.seed",
    "*.pid.lock",
    ".DS_Store",
    "Thumbs.db",
    "*.swp",
    "*.swo",
    "*~",
  ],
  // Files that should be kept
  whitelist: [".env.example", ".env.sample"],
};

interface CleanupStats {
  directoriesRemoved: number;
  filesRemoved: number;
  spaceFreed: number;
}

/**
 * Calculate directory size recursively
 */
async function getDirectorySize(dir: string): Promise<number> {
  let size = 0;

  try {
    const files = await glob("**/*", {
      cwd: dir,
      dot: true,
      onlyFiles: true,
      followSymbolicLinks: false,
      ignore: ["**/node_modules/**"], // Avoid deep recursion in node_modules
    });

    for (const file of files) {
      try {
        const stats = await stat(join(dir, file));
        size += stats.size;
      } catch {
        // Ignore inaccessible files
      }
    }
  } catch {
    // Return 0 if directory is inaccessible
  }

  return size;
}

/**
 * Remove a directory and track stats
 */
async function removeDirectory(path: string, stats: CleanupStats): Promise<void> {
  if (!existsSync(path)) return;

  try {
    const size = await getDirectorySize(path);
    await rm(path, { recursive: true, force: true });
    stats.directoriesRemoved++;
    stats.spaceFreed += size;
    console.log(pc.yellow(`  ✗ Removed directory: ${path} (${formatBytes(size)})`));
  } catch (error) {
    console.error(pc.red(`  ⚠ Failed to remove ${path}: ${error}`));
  }
}

/**
 * Remove files matching a pattern
 */
async function removeFiles(
  templatePath: string,
  pattern: string,
  stats: CleanupStats,
): Promise<void> {
  const files = await glob(pattern, {
    cwd: templatePath,
    dot: true,
    absolute: true,
    ignore: ARTIFACTS_TO_REMOVE.whitelist,
  });

  for (const file of files) {
    try {
      const fileStats = await stat(file);
      await rm(file, { force: true });
      stats.filesRemoved++;
      stats.spaceFreed += fileStats.size;
      console.log(pc.yellow(`  ✗ Removed file: ${file} (${formatBytes(fileStats.size)})`));
    } catch (error) {
      console.error(pc.red(`  ⚠ Failed to remove ${file}: ${error}`));
    }
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Clean a single template
 */
async function cleanTemplate(templatePath: string): Promise<CleanupStats> {
  const templateName = templatePath.split("/").pop();
  console.log(pc.cyan(`\n📦 Cleaning template: ${templateName}`));

  const stats: CleanupStats = {
    directoriesRemoved: 0,
    filesRemoved: 0,
    spaceFreed: 0,
  };

  // Remove directories
  for (const dir of ARTIFACTS_TO_REMOVE.directories) {
    // Find all occurrences recursively
    const directories = await glob(`**/${dir}`, {
      cwd: templatePath,
      dot: true,
      onlyDirectories: true,
      absolute: true,
    });

    for (const dirPath of directories) {
      await removeDirectory(dirPath, stats);
    }
  }

  // Remove files
  for (const filePattern of ARTIFACTS_TO_REMOVE.files) {
    await removeFiles(templatePath, `**/${filePattern}`, stats);
  }

  // Special handling for root-level artifacts
  const rootArtifacts = ["node_modules", ".turbo", "dist", ".next", "pnpm-lock.yaml"];
  for (const artifact of rootArtifacts) {
    const artifactPath = join(templatePath, artifact);
    if (existsSync(artifactPath)) {
      const artifactStats = await stat(artifactPath);
      if (artifactStats.isDirectory()) {
        await removeDirectory(artifactPath, stats);
      } else {
        await rm(artifactPath, { force: true });
        stats.filesRemoved++;
        stats.spaceFreed += artifactStats.size;
        console.log(pc.yellow(`  ✗ Removed: ${artifact}`));
      }
    }
  }

  return stats;
}

/**
 * Validate template is clean
 */
async function validateTemplate(templatePath: string): Promise<boolean> {
  const templateName = templatePath.split("/").pop();
  console.log(pc.cyan(`\n🔍 Validating template: ${templateName}`));

  let isClean = true;
  const issues: string[] = [];

  // Check for forbidden directories
  for (const dir of ARTIFACTS_TO_REMOVE.directories) {
    const found = await glob(`**/${dir}`, {
      cwd: templatePath,
      onlyDirectories: true,
    });

    if (found.length > 0) {
      isClean = false;
      issues.push(`Found ${found.length} ${dir} directories`);
    }
  }

  // Check for forbidden files
  for (const filePattern of ARTIFACTS_TO_REMOVE.files) {
    if (ARTIFACTS_TO_REMOVE.whitelist.some((w) => filePattern.includes(w.replace(".", "")))) {
      continue;
    }

    const found = await glob(`**/${filePattern}`, {
      cwd: templatePath,
      dot: true,
      ignore: ARTIFACTS_TO_REMOVE.whitelist,
    });

    if (found.length > 0) {
      isClean = false;
      issues.push(`Found ${found.length} files matching ${filePattern}`);
    }
  }

  if (isClean) {
    console.log(pc.green(`  ✓ Template is clean`));
  } else {
    console.log(pc.red(`  ✗ Template has issues:`));
    issues.forEach((issue) => console.log(pc.red(`    - ${issue}`)));
  }

  return isClean;
}

/**
 * Main cleanup function
 */
async function main() {
  console.log(pc.bold("\n🧹 Atlas Template Cleanup\n"));
  console.log(pc.gray("This will remove all build artifacts from template directories.\n"));

  const templatesDir = join(process.cwd(), "templates");

  if (!existsSync(templatesDir)) {
    console.error(pc.red("Templates directory not found!"));
    process.exit(1);
  }

  // Get all template directories
  const templates = await readdir(templatesDir);
  const templatePaths = [];

  for (const template of templates) {
    const templatePath = join(templatesDir, template);
    const stats = await stat(templatePath);

    if (stats.isDirectory()) {
      templatePaths.push(templatePath);
    }
  }

  if (templatePaths.length === 0) {
    console.log(pc.yellow("No templates found to clean."));
    return;
  }

  // Clean all templates
  const totalStats: CleanupStats = {
    directoriesRemoved: 0,
    filesRemoved: 0,
    spaceFreed: 0,
  };

  for (const templatePath of templatePaths) {
    const stats = await cleanTemplate(templatePath);
    totalStats.directoriesRemoved += stats.directoriesRemoved;
    totalStats.filesRemoved += stats.filesRemoved;
    totalStats.spaceFreed += stats.spaceFreed;
  }

  // Validate all templates
  console.log(pc.bold("\n🔍 Validating cleaned templates..."));
  let allClean = true;

  for (const templatePath of templatePaths) {
    const isClean = await validateTemplate(templatePath);
    if (!isClean) {
      allClean = false;
    }
  }

  // Summary
  console.log(pc.bold("\n📊 Cleanup Summary:"));
  console.log(pc.cyan(`  • Directories removed: ${totalStats.directoriesRemoved}`));
  console.log(pc.cyan(`  • Files removed: ${totalStats.filesRemoved}`));
  console.log(pc.cyan(`  • Space freed: ${formatBytes(totalStats.spaceFreed)}`));

  if (allClean) {
    console.log(pc.bold(pc.green("\n✅ All templates are clean and ready for packaging!\n")));
  } else {
    console.log(
      pc.bold(pc.red("\n⚠️ Some templates still have issues. Please review the output above.\n")),
    );
    process.exit(1);
  }
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error(pc.red("Unhandled error:"), error);
  process.exit(1);
});

main().catch((error) => {
  console.error(pc.red("Cleanup failed:"), error);
  process.exit(1);
});
