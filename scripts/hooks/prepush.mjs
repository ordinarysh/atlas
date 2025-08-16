#!/usr/bin/env node
import { execSync } from "child_process";
import pc from "picocolors";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger();

// Skip on CI
if (process.env.CI === "true") {
  logger.info(pc.dim("⏭️  Skipping pre-push hooks in CI environment"));
  process.exit(0);
}

// Version checks
function checkVersions() {
  try {
    // Check Node version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.split(".")[0].slice(1));
    if (nodeMajor < 22) {
      logger.warn(`Node ${nodeVersion} detected. Recommended: v22+`);
      logger.info(pc.dim("   Skipping pre-push hooks for compatibility"));
      process.exit(0);
    }

    // Check pnpm version
    const pnpmVersion = execSync("pnpm --version", { encoding: "utf8" }).trim();
    const [major, minor] = pnpmVersion.split(".").map(Number);
    if (major < 10 || (major === 10 && minor < 14)) {
      logger.warn(`pnpm ${pnpmVersion} detected. Recommended: 10.14+`);
      logger.info(pc.dim("   Skipping pre-push hooks for compatibility"));
      process.exit(0);
    }
  } catch {
    logger.warn("Could not verify Node/pnpm versions");
    logger.info(pc.dim("   Continuing with pre-push hooks..."));
  }
}

// Enable Corepack
function enableCorepack() {
  try {
    execSync("corepack enable", { stdio: "ignore" });
  } catch {
    // Corepack might not be available, continue anyway
  }
}

// Get changed files between local and remote
function getChangedFiles() {
  try {
    // Get the current branch
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();

    // Try to get the remote tracking branch
    let remoteBranch;
    try {
      remoteBranch = execSync(`git rev-parse --abbrev-ref ${branch}@{upstream}`, {
        encoding: "utf8",
      }).trim();
    } catch {
      // No upstream, compare with origin/main or origin/master
      try {
        execSync("git rev-parse origin/main", { stdio: "ignore" });
        remoteBranch = "origin/main";
      } catch {
        try {
          execSync("git rev-parse origin/master", { stdio: "ignore" });
          remoteBranch = "origin/master";
        } catch {
          // No main or master, this might be a new repo
          logger.warn("No remote branch found for comparison");
          return [];
        }
      }
    }

    // Get list of changed files
    const changedFiles = execSync(`git diff --name-only ${remoteBranch}...HEAD`, {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);

    return changedFiles;
  } catch {
    logger.warn("Could not determine changed files");
    return [];
  }
}

// Run validation on changed files
function runValidation() {
  const changedFiles = getChangedFiles();

  // Check if any schema-related files changed
  const schemaRelatedFiles = changedFiles.filter(
    (file) =>
      file.includes("manifest.json") ||
      file.includes("steps.json") ||
      file.includes("plan.json") ||
      file.startsWith("templates/") ||
      file.startsWith("addons/") ||
      file.startsWith("migrations/") ||
      file.includes("SCHEMA."),
  );

  if (schemaRelatedFiles.length === 0) {
    logger.info(pc.dim("  No schema-related files changed, skipping validation"));
    return;
  }

  logger.info(pc.cyan(`  Validating ${schemaRelatedFiles.length} changed schema-related files...`));

  try {
    // Run validation with --changed flag if available
    const hasChangedFlag = checkValidateSupportsChanged();

    if (hasChangedFlag) {
      execSync("pnpm validate --changed", { stdio: "inherit" });
    } else {
      execSync("pnpm validate", { stdio: "inherit" });
    }

    logger.success("  Schema validation passed");
  } catch {
    logger.error("Schema validation failed");
    logger.error(pc.dim("Fix the validation errors or use --no-verify to bypass"));
    process.exit(1);
  }
}

// Check if validate script supports --changed flag
function checkValidateSupportsChanged() {
  try {
    const validateContent = execSync("cat scripts/validate.ts 2>/dev/null", { encoding: "utf8" });
    return validateContent.includes("--changed");
  } catch {
    return false;
  }
}

// Light type check (only on changed TS files)
function runLightTypeCheck() {
  const changedFiles = getChangedFiles();
  const tsFiles = changedFiles.filter(
    (file) =>
      (file.endsWith(".ts") || file.endsWith(".tsx")) &&
      !file.startsWith("templates/") &&
      !file.startsWith("fixtures/"),
  );

  if (tsFiles.length === 0) {
    logger.info(pc.dim("  No TypeScript files changed, skipping type check"));
    return;
  }

  logger.info(pc.cyan(`  Type checking ${tsFiles.length} changed TypeScript files...`));

  try {
    execSync("pnpm typecheck", { stdio: "inherit" });
    logger.success("  Type check passed");
  } catch {
    logger.error("Type check failed");
    logger.error(pc.dim("Fix the type errors or use --no-verify to bypass"));
    process.exit(1);
  }
}

// Main execution
async function main() {
  const startTime = Date.now();

  logger.info(pc.dim("──────────────────────────"));
  logger.info(pc.cyan("🚀 Pre-push Hook (Light)"));
  logger.info(pc.dim("──────────────────────────"));

  checkVersions();
  enableCorepack();

  logger.info(pc.cyan("Running pre-push checks..."));

  // Run checks in sequence (they're already fast)
  runValidation();
  runLightTypeCheck();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.success(`Pre-push checks passed in ${duration}s`);
  logger.info(pc.dim("──────────────────────────"));
}

main().catch((error) => {
  logger.error(`Pre-push hook failed: ${error.message}`);
  process.exit(1);
});
