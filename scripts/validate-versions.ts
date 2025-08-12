#!/usr/bin/env tsx

/**
 * Validates that Node.js and pnpm versions meet minimum requirements
 * Used in CI to ensure consistent runtime environments
 */

import { execSync } from "child_process";
import * as semver from "semver";
import pc from "picocolors";

interface VersionRequirement {
  name: string;
  command: string;
  parseVersion: (output: string) => string;
  minVersion: string;
}

const requirements: VersionRequirement[] = [
  {
    name: "Node.js",
    command: "node --version",
    parseVersion: (output) => output.trim().replace(/^v/, ""),
    minVersion: "22.18.0",
  },
  {
    name: "pnpm",
    command: "pnpm --version",
    parseVersion: (output) => output.trim(),
    minVersion: "10.14.0",
  },
];

function validateVersion(req: VersionRequirement): boolean {
  try {
    const output = execSync(req.command, { encoding: "utf-8" });
    const version = req.parseVersion(output);

    if (!semver.valid(version)) {
      console.error(pc.red(`❌ Invalid ${req.name} version: ${version}`));
      return false;
    }

    if (!semver.gte(version, req.minVersion)) {
      console.error(
        pc.red(`❌ ${req.name} version ${version} does not satisfy >=${req.minVersion}`),
      );
      console.error(
        pc.yellow(`   Please upgrade ${req.name} to version ${req.minVersion} or higher`),
      );
      return false;
    }

    console.log(pc.green(`✅ ${req.name} version ${version} satisfies >=${req.minVersion}`));
    return true;
  } catch (error) {
    console.error(pc.red(`❌ Failed to check ${req.name} version:`));
    console.error(pc.red(`   ${error instanceof Error ? error.message : String(error)}`));
    return false;
  }
}

function main(): void {
  console.log(pc.bold("Validating runtime versions...\n"));

  let allValid = true;

  for (const req of requirements) {
    if (!validateVersion(req)) {
      allValid = false;
    }
  }

  console.log();

  if (!allValid) {
    console.error(pc.red("❌ Version validation failed"));
    console.error(pc.yellow("\nTo fix version issues:"));
    console.error(pc.yellow("1. For Node.js: Use nvm or fnm to install Node.js 22.18+"));
    console.error(
      pc.yellow('2. For pnpm: Run "corepack enable" and "corepack prepare pnpm@latest --activate"'),
    );
    process.exit(1);
  }

  console.log(pc.green("✅ All version requirements satisfied"));

  // Additional info
  console.log(pc.dim("\nVersion resolution:"));
  console.log(pc.dim("- Node.js version is resolved from .nvmrc file"));
  console.log(pc.dim("- pnpm version is resolved from packageManager field in package.json"));
}

// Run if executed directly
main();

export { validateVersion, requirements };
