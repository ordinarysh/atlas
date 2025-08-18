#!/usr/bin/env tsx
/**
 * Template Cleanup Script
 *
 * Removes all build artifacts and machine-specific files from template directories
 * before packaging for release. This ensures templates are clean and portable.
 *
 * Usage:
 *   pnpm clean:templates          # Clean all templates
 *   pnpm clean:templates --dry-run  # Preview what would be removed
 *
 * Environment variables:
 *   DRY_RUN=1 pnpm clean:templates  # Also enables dry run mode
 */

import { rm, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import pc from "picocolors";
import glob from "fast-glob";

// Global configuration
const isDryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

// Artifacts to remove from templates
const ARTIFACTS_TO_REMOVE = {
  directories: [
    // Package managers
    "node_modules",
    ".pnpm-store",
    ".npm",
    ".yarn",
    ".bun",

    // Build outputs
    "dist",
    "build",
    "out",

    // Framework-specific
    ".next",
    ".nuxt",
    ".vite",
    ".turbo",
    ".nx",
    ".rush",

    // Bundler caches
    ".cache",
    ".swc",
    ".esbuild",
    ".parcel-cache",
    ".rollup.cache",
    ".webpack",
    ".rspack",
    ".rsbuild",

    // Testing
    "coverage",
    "test-results",
    "playwright-report",
    "storybook-static",

    // Development tools
    ".vscode/settings.json.backup",
    ".idea",
    ".tscache",

    // Deployment
    ".vercel",
    ".netlify",

    // Temp directories
    ".tmp",
    ".temp",
    "tmp",
    "temp",
  ],
  files: [
    // TypeScript build info
    "*.tsbuildinfo",
    "tsconfig.tsbuildinfo",

    // Lock files (templates shouldn't include these)
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "bun.lockb",

    // Environment files (except examples)
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".env.staging",
    ".env.test",

    // Cache files
    ".eslintcache",
    ".prettiercache",
    ".stylelintcache",

    // Vite timestamp files
    "vite.config.ts.timestamp-*",
    "vite.config.js.timestamp-*",

    // Log files
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".pnpm-debug.log*",
    "lerna-debug.log*",
    "turbo-*.log",
    "next-*.log",
    "vite-*.log",

    // Process files
    "*.pid",
    "*.seed",
    "*.pid.lock",

    // Analysis files
    "build-analysis.json",
    "analyze-bundle.html",
    "webpack-stats.json",

    // OS files
    ".DS_Store",
    ".DS_Store?",
    "._*",
    ".Spotlight-V100",
    ".Trashes",
    "Thumbs.db",
    "ehthumbs.db",
    "Desktop.ini",
    ".directory",

    // Editor files
    "*.swp",
    "*.swo",
    "*~",
    ".sublime-workspace",
    "*.code-workspace",
    ".brackets.json",
  ],
  // Files that should be kept
  whitelist: [
    ".env.example",
    ".env.sample",
    ".vscode/extensions.json",
    ".vscode/settings.json.example",
    ".gitignore",
    ".gitattributes",
    ".nvmrc", // Version manager files should typically be kept
    ".node-version",
  ],
};

interface CleanupStats {
  directoriesRemoved: number;
  filesRemoved: number;
  spaceFreed: number;
}

/**
 * Calculate directory size recursively with better handling
 */
async function getDirectorySize(dir: string): Promise<number> {
  let size = 0;

  try {
    const files = await glob("**/*", {
      cwd: dir,
      dot: true,
      onlyFiles: true,
      followSymbolicLinks: false,
      // Don't ignore anything when calculating size - we want accurate measurements
    });

    for (const file of files) {
      try {
        const stats = await stat(join(dir, file));
        size += stats.size;
      } catch {
        // Ignore inaccessible files (permission issues, broken symlinks)
      }
    }
  } catch {
    // If glob fails, try to get directory stats directly
    try {
      const dirStats = await stat(dir);
      if (dirStats.isDirectory()) {
        // For very large directories, approximate size
        size = 1024; // 1KB placeholder
      }
    } catch {
      // Return 0 if completely inaccessible
    }
  }

  return size;
}

/**
 * Remove a directory and track stats with enhanced error handling
 */
async function removeDirectory(path: string, stats: CleanupStats): Promise<void> {
  if (!existsSync(path)) return;

  try {
    const size = await getDirectorySize(path);

    if (isDryRun) {
      console.log(pc.blue(`  [DRY RUN] Would remove directory: ${path} (${formatBytes(size)})`));
      stats.directoriesRemoved++;
      stats.spaceFreed += size;
      return;
    }

    // Try multiple removal strategies for robustness
    try {
      await rm(path, { recursive: true, force: true, maxRetries: 3 });
    } catch (firstError) {
      // On Windows or with permission issues, try alternative approach
      try {
        await rm(path, { recursive: true, force: true, maxRetries: 0 });
      } catch (secondError) {
        throw new Error(`Both removal attempts failed: ${firstError}; ${secondError}`);
      }
    }

    stats.directoriesRemoved++;
    stats.spaceFreed += size;
    console.log(pc.yellow(`  ✗ Removed directory: ${path} (${formatBytes(size)})`));
  } catch (error) {
    console.error(pc.red(`  ⚠ Failed to remove ${path}: ${error}`));

    // Try to provide helpful error context
    try {
      const pathStats = await stat(path);
      if (pathStats.isDirectory()) {
        console.error(pc.red(`    Directory still exists, may have permission issues`));
      }
    } catch {
      // Path might have been partially removed
    }
  }
}

/**
 * Check if a file should be whitelisted (kept)
 */
function isWhitelisted(filePath: string): boolean {
  const fileName = filePath.split("/").pop() || "";
  return ARTIFACTS_TO_REMOVE.whitelist.some((whitelistItem) => {
    // Exact match
    if (fileName === whitelistItem) return true;

    // Pattern match for extensions
    if (whitelistItem.includes("*")) {
      const pattern = whitelistItem.replace("*", ".*");
      return new RegExp(pattern).test(fileName);
    }

    return false;
  });
}

/**
 * Remove files matching a pattern with improved whitelist handling
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
    // Don't rely on glob ignore for complex whitelist logic
  });

  for (const file of files) {
    // Check whitelist before removal
    if (isWhitelisted(file)) {
      continue;
    }

    try {
      const fileStats = await stat(file);

      if (isDryRun) {
        console.log(
          pc.blue(`  [DRY RUN] Would remove file: ${file} (${formatBytes(fileStats.size)})`),
        );
        stats.filesRemoved++;
        stats.spaceFreed += fileStats.size;
        continue;
      }

      await rm(file, { force: true, maxRetries: 2 });
      stats.filesRemoved++;
      stats.spaceFreed += fileStats.size;
      console.log(pc.yellow(`  ✗ Removed file: ${file} (${formatBytes(fileStats.size)})`));
    } catch (error) {
      console.error(pc.red(`  ⚠ Failed to remove ${file}: ${error}`));
    }
  }
}

/**
 * Check if a file is a legitimate config file that should be preserved
 */
function isConfigFile(filePath: string): boolean {
  const fileName = filePath.split("/").pop() || "";
  const configPatterns = [
    /^vitest\.config\.(js|ts)$/,
    /^vite\.config\.(js|ts)$/,
    /^eslint\.config\.(js|mjs|ts)$/,
    /^prettier\.config\.(js|ts)$/,
    /^tailwind\.config\.(js|ts)$/,
    /^tsconfig.*\.json$/,
    /^jest\.config\.(js|ts)$/,
    /^rollup\.config\.(js|ts)$/,
    /^webpack\.config\.(js|ts)$/,
    /^babel\.config\.(js|ts)$/,
    /^postcss\.config\.(js|ts)$/,
  ];
  
  return configPatterns.some(pattern => pattern.test(fileName));
}

/**
 * Clean TypeScript build artifacts from src directories (excluding config files)
 */
async function cleanTypeScriptArtifacts(
  templatePath: string,
  stats: CleanupStats,
): Promise<void> {
  // Find .d.ts files in src directories that have corresponding .ts files (generated declarations)
  const declarationFiles = await glob("**/src/**/*.d.ts", {
    cwd: templatePath,
    absolute: true,
    dot: true,
  });

  for (const file of declarationFiles) {
    if (isWhitelisted(file)) continue;

    // Check if there's a corresponding TypeScript source file
    const tsFile = file.replace(/\.d\.ts$/, '.ts');
    const tsxFile = file.replace(/\.d\.ts$/, '.tsx');
    
    if (existsSync(tsFile) || existsSync(tsxFile)) {
      try {
        const fileStats = await stat(file);
        
        if (isDryRun) {
          console.log(pc.blue(`  [DRY RUN] Would remove generated TypeScript declaration: ${file}`));
          stats.filesRemoved++;
          stats.spaceFreed += fileStats.size;
        } else {
          await rm(file, { force: true });
          stats.filesRemoved++;
          stats.spaceFreed += fileStats.size;
          console.log(pc.yellow(`  ✗ Removed generated TypeScript declaration: ${file}`));
        }
      } catch (error) {
        console.error(pc.red(`  ⚠ Failed to remove ${file}: ${error}`));
      }
    }
  }

  // Find all .map files (always safe to remove - these are source maps)
  const mapFiles = await glob("**/*.map", {
    cwd: templatePath,
    absolute: true,
    dot: true,
  });

  for (const file of mapFiles) {
    if (isWhitelisted(file)) continue;

    try {
      const fileStats = await stat(file);
      
      if (isDryRun) {
        console.log(pc.blue(`  [DRY RUN] Would remove source map: ${file}`));
        stats.filesRemoved++;
        stats.spaceFreed += fileStats.size;
      } else {
        await rm(file, { force: true });
        stats.filesRemoved++;
        stats.spaceFreed += fileStats.size;
        console.log(pc.yellow(`  ✗ Removed source map: ${file}`));
      }
    } catch (error) {
      console.error(pc.red(`  ⚠ Failed to remove ${file}: ${error}`));
    }
  }

  // Find .js files in src directories that have corresponding .ts files (compiled outputs)
  const jsFiles = await glob("**/src/**/*.js", {
    cwd: templatePath,
    absolute: true,
    dot: true,
  });

  for (const jsFile of jsFiles) {
    if (isWhitelisted(jsFile) || isConfigFile(jsFile)) continue;

    // Check if there's a corresponding TypeScript file
    const tsFile = jsFile.replace(/\.js$/, '.ts');
    const tsxFile = jsFile.replace(/\.js$/, '.tsx');
    
    if (existsSync(tsFile) || existsSync(tsxFile)) {
      try {
        const fileStats = await stat(jsFile);
        
        if (isDryRun) {
          console.log(pc.blue(`  [DRY RUN] Would remove compiled JS from src: ${jsFile}`));
          stats.filesRemoved++;
          stats.spaceFreed += fileStats.size;
        } else {
          await rm(jsFile, { force: true });
          stats.filesRemoved++;
          stats.spaceFreed += fileStats.size;
          console.log(pc.yellow(`  ✗ Removed compiled JS from src: ${jsFile}`));
        }
      } catch (error) {
        console.error(pc.red(`  ⚠ Failed to remove ${jsFile}: ${error}`));
      }
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

  // Special handling for root-level artifacts (ensure these are always checked)
  const criticalRootArtifacts = [
    // Most common build artifacts that must be removed
    "node_modules",
    ".turbo",
    "dist",
    ".next",
    ".vite",
    ".cache",
    // Lock files that shouldn't be in templates
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "bun.lockb",
    // Common caches
    ".eslintcache",
    ".prettiercache",
    ".stylelintcache",
    // Build info
    "tsconfig.tsbuildinfo",
    ".tsbuildinfo",
  ];

  for (const artifact of criticalRootArtifacts) {
    const artifactPath = join(templatePath, artifact);
    if (existsSync(artifactPath)) {
      // Check whitelist before removal
      if (isWhitelisted(artifactPath)) {
        continue;
      }

      const artifactStats = await stat(artifactPath);
      if (artifactStats.isDirectory()) {
        await removeDirectory(artifactPath, stats);
      } else {
        if (isDryRun) {
          console.log(
            pc.blue(`  [DRY RUN] Would remove: ${artifact} (${formatBytes(artifactStats.size)})`),
          );
          stats.filesRemoved++;
          stats.spaceFreed += artifactStats.size;
        } else {
          await rm(artifactPath, { force: true });
          stats.filesRemoved++;
          stats.spaceFreed += artifactStats.size;
          console.log(pc.yellow(`  ✗ Removed: ${artifact} (${formatBytes(artifactStats.size)})`));
        }
      }
    }
  }

  // Clean TypeScript build artifacts
  await cleanTypeScriptArtifacts(templatePath, stats);

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

  // Check for forbidden files with improved whitelist logic
  for (const filePattern of ARTIFACTS_TO_REMOVE.files) {
    const found = await glob(`**/${filePattern}`, {
      cwd: templatePath,
      dot: true,
    });

    // Filter out whitelisted files
    const forbiddenFiles = found.filter((file) => !isWhitelisted(join(templatePath, file)));

    if (forbiddenFiles.length > 0) {
      isClean = false;
      issues.push(
        `Found ${forbiddenFiles.length} files matching ${filePattern} (excluding whitelisted)`,
      );
    }
  }

  // Check for generated TypeScript declaration files in src directories (.d.ts with .ts counterparts)
  const declarationFiles = await glob("**/src/**/*.d.ts", {
    cwd: templatePath,
    dot: true,
  });
  let generatedDeclarationCount = 0;
  for (const declarationFile of declarationFiles) {
    const fullDtsPath = join(templatePath, declarationFile);
    if (isWhitelisted(fullDtsPath)) continue;
    
    const tsFile = fullDtsPath.replace(/\.d\.ts$/, '.ts');
    const tsxFile = fullDtsPath.replace(/\.d\.ts$/, '.tsx');
    if (existsSync(tsFile) || existsSync(tsxFile)) {
      generatedDeclarationCount++;
    }
  }
  if (generatedDeclarationCount > 0) {
    isClean = false;
    issues.push(`Found ${generatedDeclarationCount} generated TypeScript declaration files in src directories (.d.ts)`);
  }

  const mapFiles = await glob("**/*.map", {
    cwd: templatePath,
    dot: true,
  });
  const forbiddenMaps = mapFiles.filter(file => !isWhitelisted(join(templatePath, file)));
  if (forbiddenMaps.length > 0) {
    isClean = false;
    issues.push(`Found ${forbiddenMaps.length} source map files (.map)`);
  }

  // Check for compiled JavaScript files in src directories that have TypeScript counterparts
  const jsFiles = await glob("**/src/**/*.js", {
    cwd: templatePath,
    dot: true,
  });
  let compiledJsCount = 0;
  for (const jsFile of jsFiles) {
    const fullJsPath = join(templatePath, jsFile);
    if (isWhitelisted(fullJsPath) || isConfigFile(fullJsPath)) continue;
    
    const tsFile = fullJsPath.replace(/\.js$/, '.ts');
    const tsxFile = fullJsPath.replace(/\.js$/, '.tsx');
    if (existsSync(tsFile) || existsSync(tsxFile)) {
      compiledJsCount++;
    }
  }
  if (compiledJsCount > 0) {
    isClean = false;
    issues.push(`Found ${compiledJsCount} compiled JavaScript files in src directories with TypeScript counterparts`);
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

  if (isDryRun) {
    console.log(pc.blue("🔍 DRY RUN MODE: No files will be actually removed\n"));
    console.log(
      pc.gray("This will show what build artifacts would be removed from template directories.\n"),
    );
  } else {
    console.log(pc.gray("This will remove all build artifacts from template directories.\n"));
  }

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
  console.log(pc.bold(`\n📊 ${isDryRun ? "Dry Run " : ""}Cleanup Summary:`));
  console.log(
    pc.cyan(
      `  • Directories ${isDryRun ? "would be " : ""}removed: ${totalStats.directoriesRemoved}`,
    ),
  );
  console.log(
    pc.cyan(`  • Files ${isDryRun ? "would be " : ""}removed: ${totalStats.filesRemoved}`),
  );
  console.log(
    pc.cyan(`  • Space ${isDryRun ? "would be " : ""}freed: ${formatBytes(totalStats.spaceFreed)}`),
  );

  if (isDryRun) {
    console.log(
      pc.bold(pc.blue("\n🔍 Dry run complete. Run without --dry-run to actually remove files.\n")),
    );
  } else if (allClean) {
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
