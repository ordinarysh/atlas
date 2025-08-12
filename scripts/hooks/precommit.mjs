#!/usr/bin/env node
/* eslint-disable no-console */
import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import pc from 'picocolors';

// Skip on CI
if (process.env.CI === 'true') {
  console.log(pc.dim('⏭️  Skipping pre-commit hooks in CI environment'));
  process.exit(0);
}

// Version checks
function checkVersions() {
  try {
    // Check Node version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.split('.')[0].slice(1));
    if (nodeMajor < 22) {
      console.log(pc.yellow(`⚠️  Node ${nodeVersion} detected. Recommended: v22+`));
      console.log(pc.dim('   Skipping pre-commit hooks for compatibility'));
      process.exit(0);
    }

    // Check pnpm version
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    const [major, minor] = pnpmVersion.split('.').map(Number);
    if (major < 10 || (major === 10 && minor < 14)) {
      console.log(pc.yellow(`⚠️  pnpm ${pnpmVersion} detected. Recommended: 10.14+`));
      console.log(pc.dim('   Skipping pre-commit hooks for compatibility'));
      process.exit(0);
    }
  } catch {
    console.log(pc.yellow('⚠️  Could not verify Node/pnpm versions'));
    console.log(pc.dim('   Continuing with pre-commit hooks...'));
  }
}

// Enable Corepack
function enableCorepack() {
  try {
    execSync('corepack enable', { stdio: 'ignore' });
  } catch {
    // Corepack might not be available, continue anyway
  }
}

// Check for forbidden files in templates/**
function checkForbiddenFiles() {
  try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);

    const forbiddenPatterns = [
      /^templates\/.*\/node_modules\//,
      /^templates\/.*\/\.turbo\//,
      /^templates\/.*\/\.next\//,
      /^templates\/.*\/dist\//,
      /^templates\/.*\.tsbuildinfo$/,
      /^templates\/.*\/pnpm-lock\.yaml$/,
      /^templates\/.*\/yarn\.lock$/,
      /^templates\/.*\/package-lock\.json$/,
      /^templates\/.*\/\.env$/,
      /^templates\/.*\/\.env\.[^.]+$/ // .env.* except .env.example
    ];

    const forbidden = stagedFiles.filter(file => {
      // Skip .env.example files
      if (file.includes('.env.example') || file.includes('.env.production.example')) {
        return false;
      }
      return forbiddenPatterns.some(pattern => pattern.test(file));
    });

    if (forbidden.length > 0) {
      console.error(pc.red('✗ Forbidden files detected in templates/**:'));
      forbidden.forEach(file => {
        console.error(pc.red(`  - ${file}`));
      });
      console.error(pc.yellow('\nThese files should not be committed to template payloads.'));
      console.error(pc.dim('Use --no-verify to bypass this check (not recommended)'));
      process.exit(1);
    }
  } catch (error) {
    console.error(pc.red('✗ Failed to check for forbidden files:'), error.message);
    process.exit(1);
  }
}

// Check file sizes
function checkFileSizes() {
  try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);

    const largeFiles = [];
    const hugeFiles = [];

    stagedFiles.forEach(file => {
      // Skip binary files and known large file types
      if (/\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|woff|woff2|ttf|eot)$/i.test(file)) {
        return;
      }

      if (existsSync(file)) {
        const stats = statSync(file);
        const sizeMB = stats.size / (1024 * 1024);
        
        if (sizeMB > 5) {
          hugeFiles.push({ file, size: sizeMB.toFixed(2) });
        } else if (sizeMB > 1) {
          largeFiles.push({ file, size: sizeMB.toFixed(2) });
        }
      }
    });

    if (hugeFiles.length > 0) {
      console.error(pc.red('✗ Files exceeding 5MB limit:'));
      hugeFiles.forEach(({ file, size }) => {
        console.error(pc.red(`  - ${file} (${size}MB)`));
      });
      console.error(pc.dim('Use --no-verify to bypass this check'));
      process.exit(1);
    }

    if (largeFiles.length > 0) {
      console.warn(pc.yellow('⚠️  Large files detected (>1MB):'));
      largeFiles.forEach(({ file, size }) => {
        console.warn(pc.yellow(`  - ${file} (${size}MB)`));
      });
    }
  } catch (error) {
    console.error(pc.red('✗ Failed to check file sizes:'), error.message);
    process.exit(1);
  }
}

// Run lint-staged
function runLintStaged() {
  try {
    console.log(pc.cyan('🔍 Running pre-commit checks...'));
    execSync('pnpm lint-staged', { stdio: 'inherit' });
    console.log(pc.green('✅ Pre-commit checks passed'));
  } catch {
    console.error(pc.red('✗ Pre-commit checks failed'));
    console.error(pc.dim('Fix the issues above or use --no-verify to bypass'));
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log(pc.dim('──────────────────────────'));
  console.log(pc.cyan('🪝 Pre-commit Hook'));
  console.log(pc.dim('──────────────────────────'));

  checkVersions();
  enableCorepack();
  checkForbiddenFiles();
  checkFileSizes();
  runLintStaged();

  console.log(pc.dim('──────────────────────────'));
}

main().catch(error => {
  console.error(pc.red('✗ Pre-commit hook failed:'), error.message);
  process.exit(1);
});