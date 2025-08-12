#!/usr/bin/env tsx
import { mkdir, readFile, writeFile, rm, access, stat } from "fs/promises";
import { join, basename } from "path";
import { createHash } from "crypto";
import { createReadStream } from "fs";
import pc from "picocolors";
import glob from "fast-glob";
import { execSync } from "child_process";
import * as tar from "tar";

const RELEASE_DIR = join(process.cwd(), "release");
const FIXED_TIMESTAMP = new Date("2024-01-01T00:00:00Z");

// Comprehensive exclusion patterns - Enhanced for better template hygiene
const EXCLUSION_PATTERNS = [
  // Dependencies - must never be included
  "node_modules/**",
  "**/node_modules/**",
  ".pnpm-store/**",
  "**/.pnpm-store/**",

  // Build outputs
  "dist/**",
  "**/dist/**",
  "build/**",
  "**/build/**",
  ".next/**",
  "**/.next/**",
  "out/**",
  "**/out/**",

  // Build caches
  ".turbo/**",
  "**/.turbo/**",
  ".cache/**",
  "**/.cache/**",
  ".vite/**",
  "**/.vite/**",

  // TypeScript artifacts
  "*.tsbuildinfo",
  "**/*.tsbuildinfo",

  // Lockfiles - templates should not enforce specific versions
  "pnpm-lock.yaml",
  "**/pnpm-lock.yaml",
  "package-lock.json",
  "**/package-lock.json",
  "yarn.lock",
  "**/yarn.lock",

  // Testing artifacts
  "coverage/**",
  "**/coverage/**",
  "playwright-report/**",
  "**/playwright-report/**",
  "test-results/**",
  "**/test-results/**",

  // Environment files
  ".env",
  ".env.*",
  "!.env.example",
  "!.env.sample",

  // Version control
  ".git/**",

  // OS files
  ".DS_Store",
  "**/.DS_Store",
  "Thumbs.db",
  "**/Thumbs.db",

  // Editor files
  ".vscode/**",
  ".idea/**",
  "*.swp",
  "*.swo",
  "*~",
  "*.sublime-workspace",

  // Logs
  "*.log",
  "**/*.log",
  "lerna-debug.log*",

  // Temporary files
  "*.tmp",
  "*.temp",
  ".tmp/**",
  ".temp/**",

  // Config files that shouldn't be in templates
  ".npmrc",
  ".yarnrc",
];

// Required files for templates
const REQUIRED_TEMPLATE_FILES = [
  "atlas.json",
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  ".gitignore",
  "README.md",
];

interface ReleaseMetadata {
  version: string;
  date: string;
  buildInfo: {
    node: string;
    platform: string;
    arch: string;
    timestamp: string;
  };
  templates: Record<string, ArtifactInfo>;
  addons: Record<string, ArtifactInfo>;
  migrations: Record<string, ArtifactInfo>;
}

interface ArtifactInfo {
  file: string;
  sha256: string;
  size: number;
  fileCount: number;
  metadata?: Record<string, unknown>;
}

async function getVersion(): Promise<string> {
  // Try to get version from git tag or describe
  try {
    const gitTag = execSync("git describe --tags --abbrev=0 2>/dev/null", {
      encoding: "utf-8",
    }).trim();
    if (gitTag.startsWith("v")) {
      return gitTag.substring(1);
    }
    return gitTag;
  } catch {
    // Fallback to package.json version or default
    try {
      const pkg = JSON.parse(await readFile("package.json", "utf-8"));
      return pkg.version || "0.0.0";
    } catch {
      return "0.0.0";
    }
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function calculateSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Validates template structure and cleanliness
 * Ensures no build artifacts are present and all required files exist
 */
async function validateTemplateStructure(templatePath: string): Promise<boolean> {
  console.log(pc.cyan(`  🔍 Validating template structure...`));

  let isValid = true;
  const missingFiles: string[] = [];
  const foundArtifacts: string[] = [];

  // Check for required files
  for (const requiredFile of REQUIRED_TEMPLATE_FILES) {
    const filePath = join(templatePath, requiredFile);
    if (!(await fileExists(filePath))) {
      missingFiles.push(requiredFile);
      isValid = false;
    }
  }

  // Check for .github/workflows/ci.yml
  const ciPath = join(templatePath, ".github", "workflows", "ci.yml");
  if (!(await fileExists(ciPath))) {
    const ciYamlPath = join(templatePath, ".github", "workflows", "ci.yaml");
    if (!(await fileExists(ciYamlPath))) {
      missingFiles.push(".github/workflows/ci.yml");
      isValid = false;
    }
  }

  if (missingFiles.length > 0) {
    console.error(pc.red(`  ✗ Missing required files:`));
    missingFiles.forEach((file) => {
      console.error(pc.red(`    - ${file}`));
    });
  } else {
    console.log(pc.green(`  ✓ All required files present`));
  }

  // Enhanced validation: Check for ALL forbidden artifacts
  const forbiddenArtifacts = [
    // Directories
    "node_modules",
    "**/node_modules",
    ".turbo",
    "**/.turbo",
    ".next",
    "**/.next",
    "dist",
    "**/dist",
    "build",
    "**/build",
    "coverage",
    "**/coverage",
    ".pnpm-store",
    "**/.pnpm-store",
    ".vite",
    "**/.vite",
    ".cache",
    "**/.cache",
  ];

  // Check for forbidden directories
  for (const pattern of forbiddenArtifacts) {
    const found = await glob(pattern, {
      cwd: templatePath,
      dot: true,
      onlyDirectories: true,
    });

    if (found.length > 0) {
      found.forEach((dir) => foundArtifacts.push(dir));
      isValid = false;
    }
  }

  // Check for forbidden files
  const forbiddenFiles = [
    "*.tsbuildinfo",
    "**/*.tsbuildinfo",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
  ];

  for (const pattern of forbiddenFiles) {
    const found = await glob(pattern, {
      cwd: templatePath,
      dot: true,
      onlyFiles: true,
    });

    if (found.length > 0) {
      found.forEach((file) => foundArtifacts.push(file));
      isValid = false;
    }
  }

  if (foundArtifacts.length > 0) {
    console.error(pc.red(`  ✗ Found build artifacts that must be removed:`));
    foundArtifacts.slice(0, 10).forEach((artifact) => {
      console.error(pc.red(`    - ${artifact}`));
    });
    if (foundArtifacts.length > 10) {
      console.error(pc.red(`    ... and ${foundArtifacts.length - 10} more`));
    }
    console.error(pc.yellow(`\n  💡 Run 'pnpm clean:templates' to remove all artifacts`));
  }

  return isValid;
}

async function createDeterministicTarball(
  sourcePath: string,
  outputPath: string,
  fileList: string[],
): Promise<void> {
  // Sort files for deterministic ordering
  const sortedFiles = fileList.sort();

  // Create tar with fixed timestamps and permissions
  await tar.create(
    {
      gzip: true,
      file: outputPath,
      cwd: sourcePath,
      portable: true,
      noMtime: true,
      // Set fixed mtime for all entries
      mtime: FIXED_TIMESTAMP,
      // Remove user/group information for consistency
      filter: (path) => {
        // Additional runtime filtering if needed
        return !path.includes("node_modules") && !path.includes(".git");
      },
    },
    sortedFiles,
  );
}

/**
 * Creates a clean template archive with validation and automatic cleanup
 */
async function createTemplateArchive(
  templatePath: string,
  templateName: string,
  version: string,
): Promise<{ fileName: string; fileCount: number; metadata: Record<string, unknown> }> {
  const outputFileName = `atlas-${templateName}-v${version}.tar.gz`;
  const outputPath = join(RELEASE_DIR, outputFileName);

  // Pre-flight cleanup check
  console.log(pc.cyan(`  🧹 Checking template cleanliness...`));
  const preCheckArtifacts = await glob(
    [
      "node_modules",
      "**/node_modules",
      "dist",
      "**/dist",
      ".turbo",
      "**/.turbo",
      "*.tsbuildinfo",
      "**/*.tsbuildinfo",
      "pnpm-lock.yaml",
    ],
    {
      cwd: templatePath,
      dot: true,
      onlyDirectories: false,
    },
  );

  if (preCheckArtifacts.length > 0) {
    console.error(pc.red(`  ✗ Template contains ${preCheckArtifacts.length} artifacts`));
    console.error(pc.yellow(`  🔧 Attempting automatic cleanup...`));

    // Auto-cleanup dangerous artifacts
    try {
      // Clean node_modules
      await execSync(
        `find "${templatePath}" -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true`,
        { encoding: "utf-8" },
      );

      // Clean dist directories
      await execSync(
        `find "${templatePath}" -name dist -type d -exec rm -rf {} + 2>/dev/null || true`,
        { encoding: "utf-8" },
      );

      // Clean .turbo directories
      await execSync(
        `find "${templatePath}" -name .turbo -type d -exec rm -rf {} + 2>/dev/null || true`,
        { encoding: "utf-8" },
      );

      // Clean tsbuildinfo files
      await execSync(
        `find "${templatePath}" -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true`,
        { encoding: "utf-8" },
      );

      // Remove lockfiles
      await execSync(
        `find "${templatePath}" \\( -name "pnpm-lock.yaml" -o -name "package-lock.json" -o -name "yarn.lock" \\) -type f -delete 2>/dev/null || true`,
        { encoding: "utf-8" },
      );

      console.log(pc.green(`  ✓ Artifacts cleaned successfully`));
    } catch (error) {
      console.error(pc.red(`  ✗ Failed to clean artifacts: ${error}`));
      throw new Error(
        `Template ${templateName} contains build artifacts. Run 'pnpm clean:templates' before building.`,
      );
    }
  }

  // Validate template structure after cleanup
  const isValid = await validateTemplateStructure(templatePath);
  if (!isValid) {
    throw new Error(
      `Template ${templateName} validation failed. Run 'pnpm clean:templates' and fix any missing files.`,
    );
  }

  // Get all files in the template directory
  const files = await glob("**/*", {
    cwd: templatePath,
    dot: true,
    ignore: EXCLUSION_PATTERNS,
    onlyFiles: true,
  });

  if (files.length === 0) {
    throw new Error(`No files found in template ${templateName}`);
  }

  console.log(pc.cyan(`  📦 Packaging ${files.length} files...`));

  // Create deterministic tarball
  await createDeterministicTarball(templatePath, outputPath, files);

  // Read template metadata if available
  let metadata = {};
  try {
    const atlasJsonPath = join(templatePath, "atlas.json");
    if (await fileExists(atlasJsonPath)) {
      const atlasJson = JSON.parse(await readFile(atlasJsonPath, "utf-8"));
      metadata = {
        name: atlasJson.name || templateName,
        description: atlasJson.description,
        type: atlasJson.type || "core",
      };
    }
  } catch {
    // Ignore metadata errors
  }

  return { fileName: outputFileName, fileCount: files.length, metadata };
}

async function createAddonArchive(
  addonPath: string,
  addonName: string,
  version: string,
): Promise<{ fileName: string; fileCount: number; metadata: Record<string, unknown> }> {
  const outputFileName = `atlas-addon-${addonName}-v${version}.tar.gz`;
  const outputPath = join(RELEASE_DIR, outputFileName);

  // Check for steps.json
  const stepsPath = join(addonPath, "steps.json");
  if (!(await fileExists(stepsPath))) {
    throw new Error(`Missing steps.json in addon ${addonName}`);
  }

  const files = await glob("**/*", {
    cwd: addonPath,
    dot: true,
    ignore: EXCLUSION_PATTERNS,
    onlyFiles: true,
  });

  if (files.length === 0) {
    throw new Error(`No files found in addon ${addonName}`);
  }

  console.log(pc.cyan(`  📦 Packaging ${files.length} files...`));

  await createDeterministicTarball(addonPath, outputPath, files);

  // Read addon metadata
  let metadata = {};
  try {
    const stepsJson = JSON.parse(await readFile(stepsPath, "utf-8"));
    metadata = {
      id: stepsJson.id,
      name: stepsJson.name,
      version: stepsJson.version,
      description: stepsJson.description,
    };
  } catch {
    // Ignore metadata errors
  }

  return { fileName: outputFileName, fileCount: files.length, metadata };
}

async function createMigrationArchive(
  migrationPath: string,
  migrationName: string,
  version: string,
): Promise<{ fileName: string; fileCount: number; metadata: Record<string, unknown> }> {
  const outputFileName = `atlas-migration-${migrationName}-v${version}.tar.gz`;
  const outputPath = join(RELEASE_DIR, outputFileName);

  // Check for plan.json
  const planPath = join(migrationPath, "plan.json");
  if (!(await fileExists(planPath))) {
    throw new Error(`Missing plan.json in migration ${migrationName}`);
  }

  const files = await glob("**/*", {
    cwd: migrationPath,
    dot: true,
    ignore: EXCLUSION_PATTERNS,
    onlyFiles: true,
  });

  if (files.length === 0) {
    throw new Error(`No files found in migration ${migrationName}`);
  }

  console.log(pc.cyan(`  📦 Packaging ${files.length} files...`));

  await createDeterministicTarball(migrationPath, outputPath, files);

  // Read migration metadata
  let metadata = {};
  try {
    const planJson = JSON.parse(await readFile(planPath, "utf-8"));
    metadata = {
      id: planJson.id,
      from: planJson.from,
      to: planJson.to,
      description: planJson.description,
      breaking: planJson.breaking,
      automated: planJson.automated,
    };
  } catch {
    // Ignore metadata errors
  }

  return { fileName: outputFileName, fileCount: files.length, metadata };
}

async function generateChecksumsFile(releaseIndex: ReleaseMetadata): Promise<void> {
  const checksumsPath = join(RELEASE_DIR, "SHA256SUMS");
  const lines: string[] = [];

  // Add checksums for all artifacts
  const addChecksums = (artifacts: Record<string, ArtifactInfo>) => {
    for (const info of Object.values(artifacts)) {
      lines.push(`${info.sha256}  ${info.file}`);
    }
  };

  addChecksums(releaseIndex.templates);
  addChecksums(releaseIndex.addons);
  addChecksums(releaseIndex.migrations);

  // Add checksum for index.json itself
  const indexPath = join(RELEASE_DIR, "index.json");
  const indexSha256 = await calculateSha256(indexPath);
  lines.push(`${indexSha256}  index.json`);

  // Sort for deterministic output
  lines.sort();

  await writeFile(checksumsPath, lines.join("\n") + "\n");
  console.log(pc.green(`\n✓ Generated SHA256SUMS file`));
}

async function main() {
  console.log(pc.bold("\n📦 Building Atlas Release Artifacts\n"));

  // Run validation first
  try {
    console.log(pc.cyan("Running validation checks..."));
    execSync("pnpm validate", { stdio: "inherit" });
  } catch {
    console.error(pc.red("\n✗ Validation failed. Fix issues before building release."));
    process.exit(1);
  }

  // Run template cleanup
  console.log(pc.cyan("\n🧹 Cleaning templates before packaging..."));
  try {
    execSync("tsx scripts/clean-templates.ts", { stdio: "inherit" });
    console.log(pc.green("✓ Templates cleaned successfully\n"));
  } catch {
    console.error(pc.red("\n✗ Template cleanup failed. Please fix issues and try again."));
    console.error(pc.yellow("Run 'pnpm clean:templates' manually to see detailed errors."));
    process.exit(1);
  }

  const version = await getVersion();
  console.log(pc.cyan(`\nVersion: ${version}`));
  console.log(pc.cyan(`Platform: ${process.platform}/${process.arch}`));
  console.log(pc.cyan(`Node: ${process.version}\n`));

  // Clean and create release directory
  await rm(RELEASE_DIR, { recursive: true, force: true });
  await mkdir(RELEASE_DIR, { recursive: true });

  const releaseIndex: ReleaseMetadata = {
    version,
    date: new Date().toISOString(),
    buildInfo: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: FIXED_TIMESTAMP.toISOString(),
    },
    templates: {},
    addons: {},
    migrations: {},
  };

  // Package templates
  console.log(pc.bold("📋 Packaging templates..."));
  const templateDirs = await glob("templates/*/", { onlyDirectories: true });

  for (const templateDir of templateDirs) {
    const templateName = basename(templateDir);

    // Skip manifest.json if it exists as a file
    if (templateName === "manifest.json") continue;

    console.log(pc.cyan(`\nProcessing template: ${templateName}`));

    try {
      const { fileName, fileCount, metadata } = await createTemplateArchive(
        templateDir,
        templateName,
        version,
      );
      const filePath = join(RELEASE_DIR, fileName);
      const sha256 = await calculateSha256(filePath);
      const stats = await stat(filePath);

      releaseIndex.templates[templateName] = {
        file: fileName,
        sha256,
        size: stats.size,
        fileCount,
        metadata,
      };

      console.log(pc.green(`  ✓ Created ${fileName}`));
      console.log(pc.gray(`    SHA256: ${sha256}`));
      console.log(pc.gray(`    Size: ${(stats.size / 1024).toFixed(2)} KB`));
      console.log(pc.gray(`    Files: ${fileCount}`));
    } catch (error) {
      console.error(pc.red(`  ✗ Failed to package template ${templateName}:`));
      console.error(pc.red(`    ${error}`));
      process.exit(1);
    }
  }

  // Package addons
  console.log(pc.bold("\n🔌 Packaging addons..."));
  const addonDirs = await glob("addons/*/", { onlyDirectories: true });

  if (addonDirs.length > 0) {
    for (const addonDir of addonDirs) {
      const addonName = basename(addonDir);
      console.log(pc.cyan(`\nProcessing addon: ${addonName}`));

      try {
        const { fileName, fileCount, metadata } = await createAddonArchive(
          addonDir,
          addonName,
          version,
        );
        const filePath = join(RELEASE_DIR, fileName);
        const sha256 = await calculateSha256(filePath);
        const stats = await stat(filePath);

        releaseIndex.addons[addonName] = {
          file: fileName,
          sha256,
          size: stats.size,
          fileCount,
          metadata,
        };

        console.log(pc.green(`  ✓ Created ${fileName}`));
        console.log(pc.gray(`    SHA256: ${sha256}`));
        console.log(pc.gray(`    Size: ${(stats.size / 1024).toFixed(2)} KB`));
        console.log(pc.gray(`    Files: ${fileCount}`));
      } catch (error) {
        console.error(pc.red(`  ✗ Failed to package addon ${addonName}:`));
        console.error(pc.red(`    ${error}`));
        process.exit(1);
      }
    }
  } else {
    console.log(pc.yellow("  No addons found"));
  }

  // Package migrations
  console.log(pc.bold("\n🔄 Packaging migrations..."));
  const migrationDirs = await glob("migrations/*/", { onlyDirectories: true });

  if (migrationDirs.length > 0) {
    for (const migrationDir of migrationDirs) {
      const migrationName = basename(migrationDir);
      console.log(pc.cyan(`\nProcessing migration: ${migrationName}`));

      try {
        const { fileName, fileCount, metadata } = await createMigrationArchive(
          migrationDir,
          migrationName,
          version,
        );
        const filePath = join(RELEASE_DIR, fileName);
        const sha256 = await calculateSha256(filePath);
        const stats = await stat(filePath);

        releaseIndex.migrations[migrationName] = {
          file: fileName,
          sha256,
          size: stats.size,
          fileCount,
          metadata,
        };

        console.log(pc.green(`  ✓ Created ${fileName}`));
        console.log(pc.gray(`    SHA256: ${sha256}`));
        console.log(pc.gray(`    Size: ${(stats.size / 1024).toFixed(2)} KB`));
        console.log(pc.gray(`    Files: ${fileCount}`));
      } catch (error) {
        console.error(pc.red(`  ✗ Failed to package migration ${migrationName}:`));
        console.error(pc.red(`    ${error}`));
        process.exit(1);
      }
    }
  } else {
    console.log(pc.yellow("  No migrations found"));
  }

  // Write release index with deterministic JSON formatting
  const indexPath = join(RELEASE_DIR, "index.json");
  await writeFile(indexPath, JSON.stringify(releaseIndex, null, 2) + "\n");
  console.log(pc.bold(pc.green(`\n✅ Release index created`)));

  // Generate checksums file
  await generateChecksumsFile(releaseIndex);

  // List all created files
  console.log(pc.bold("\n📦 Release contents:"));
  const releaseFiles = await glob("*", { cwd: RELEASE_DIR });
  for (const file of releaseFiles.sort()) {
    const filePath = join(RELEASE_DIR, file);
    const stats = await stat(filePath);
    console.log(pc.cyan(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`));
  }

  // Verification section
  console.log(pc.bold("\n🔒 Integrity Verification:"));
  console.log(pc.green(`  ✓ All artifacts have SHA256 checksums`));
  console.log(pc.green(`  ✓ Deterministic builds enabled (fixed timestamps)`));
  console.log(pc.green(`  ✓ Excluded paths respected (node_modules, .next, .turbo)`));
  console.log(pc.green(`  ✓ Required files validated before packaging`));

  console.log(pc.bold(pc.green("\n✨ Release build complete!\n")));
  console.log(pc.cyan("To verify integrity:"));
  console.log(pc.gray(`  cd ${RELEASE_DIR} && sha256sum -c SHA256SUMS`));
}

// Handle errors gracefully
process.on("unhandledRejection", (error) => {
  console.error(pc.red("Unhandled error:"), error);
  process.exit(1);
});

main().catch((error) => {
  console.error(pc.red("Build failed:"), error);
  process.exit(1);
});
