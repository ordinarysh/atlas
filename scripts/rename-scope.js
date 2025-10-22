#!/usr/bin/env node

/**
 * Safe package scope renaming script
 * Renames @ordinarysh/* to a custom scope across the monorepo
 * 
 * Usage:
 *   node scripts/rename-scope.js --check          # Preview files
 *   node scripts/rename-scope.js --scope myorg    # Apply changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

// Glob patterns to auto-discover files containing @ordinarysh references
const globPatterns = [
  'apps/**/package.json',
  'apps/**/tsconfig.json',
  'apps/**/*.config.js',
  'apps/**/*.config.mjs',
  'apps/**/*.config.ts',
  'apps/**/*.tsx',
  'apps/**/*.ts',
  'packages/**/package.json',
  'packages/**/tsconfig.json',
  'packages/**/*.config.js',
  'packages/**/*.config.mjs',
  'packages/**/*.mjs',
];

function getFilesToScan() {
  const files = new Set();
  for (const pattern of globPatterns) {
    const matches = globSync(pattern, {
      cwd: rootDir,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    });
    matches.forEach(f => files.add(f));
  }
  return Array.from(files);
}

// Packages that need renaming
const packages = [
  'ui',
  'eslint-config',
  'tailwind-config',
  'typescript-config',
];

const oldScope = '@ordinarysh';
let dryRun = false;
let newScope = null;

// Parse CLI arguments
const args = process.argv.slice(2);
if (args.includes('--dry-run') || args.includes('--check')) {
  dryRun = true;
}
const scopeIndex = args.indexOf('--scope');
if (scopeIndex !== -1 && args[scopeIndex + 1]) {
  newScope = args[scopeIndex + 1];
}

/**
 * Validates scope name (alphanumeric, hyphens, no leading/trailing hyphens)
 */
function isValidScope(scope) {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(scope);
}

/**
 * Reads file safely
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Writes file safely (only in non-dry-run mode)
 */
function writeFileContent(filePath, content) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Finds all @ordinarysh references in a file
 */
function findReferences(content) {
  if (!content) return [];
  
  const pattern = /@ordinarysh\/[\w-]+/g;
  const matches = content.match(pattern) || [];
  return [...new Set(matches)]; // Deduplicate
}

/**
 * Replaces all @ordinarysh references with new scope
 */
function replaceReferences(content, newScope) {
  if (!content) return content;
  return content.replace(/@ordinarysh\//g, `@${newScope}/`);
}

/**
 * Scans all files and reports findings
 */
function scanFiles() {
  const findings = [];
  const filesToScan = getFilesToScan();
  
  for (const file of filesToScan) {
    const fullPath = path.join(rootDir, file);
    const content = readFileContent(fullPath);
    
    if (!content) continue;
    
    const refs = findReferences(content);
    if (refs.length > 0) {
      findings.push({
        file,
        fullPath,
        content,
        references: refs,
      });
    }
  }
  
  return findings;
}

/**
 * Counts total references
 */
function countReferences(findings) {
  return findings.reduce((sum, f) => sum + f.references.length, 0);
}

/**
 * Counts references in a single file
 */
function countFileReferences(content) {
  if (!content) return 0;
  const pattern = /@ordinarysh\/[\w-]+/g;
  const matches = content.match(pattern) || [];
  return matches.length;
}

/**
 * Applies renaming to all files
 */
function applyRenaming(findings, newScope) {
  let updatedCount = 0;
  
  for (const finding of findings) {
    const newContent = replaceReferences(finding.content, newScope);
    writeFileContent(finding.fullPath, newContent);
    updatedCount++;
  }
  
  return updatedCount;
}

/**
 * Interactive prompt for new scope with retry support
 */
async function promptForScope() {
  while (true) {
    const answer = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      rl.question('Enter new scope name (e.g., ordinarysh): ', (input) => {
        rl.close();
        resolve(input.trim());
      });
      
      // Handle ESC key (Ctrl+C)
      rl.on('close', () => {
        if (!rl.terminal) return;
      });
    });
    
    if (!answer) {
      console.log(`${colors.yellow}[!]${colors.reset} Scope name cannot be empty. Please try again.\n`);
      continue;
    }
    
    if (!isValidScope(answer)) {
      console.log(`${colors.red}[!]${colors.reset} Invalid scope name. Use lowercase alphanumeric and hyphens.\n`);
      continue;
    }
    
    return answer;
  }
}

/**
 * Interactive confirmation prompt with retry and ESC support
 */
async function promptConfirmation(message) {
  while (true) {
    const answer = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      rl.question(message, (input) => {
        rl.close();
        resolve(input.trim().toLowerCase());
      });
    });
    
    // Empty input defaults to 'no' (safe default)
    if (answer === '' || answer === 'n' || answer === 'no') {
      return false;
    }
    
    if (answer === 'y' || answer === 'yes') {
      return true;
    }
    
    // Invalid input, ask again
    console.log(`${colors.yellow}[!]${colors.reset} Please enter 'y' or 'n'.\n`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('[*] Atlas Package Scope Renaming Tool\n');
  
  // Scan files first
  const findings = scanFiles();
  
  if (findings.length === 0) {
    console.log('[OK] No @ordinarysh references found.\n');
    process.exit(0);
  }
  
  const totalCount = countReferences(findings);
  
  // Handle check mode
  if (dryRun) {
    console.log(`Found ${totalCount} reference(s) in:\n`);
    for (const finding of findings) {
      const count = countFileReferences(finding.content);
      console.log(`  ${finding.file} (${count})`);
    }
    console.log();
    process.exit(0);
  }
  
  // Get new scope
  if (!newScope) {
    newScope = await promptForScope();
  }
  
  // Validate scope
  if (!isValidScope(newScope)) {
    console.error(`${colors.red}[ERROR]${colors.reset} Invalid scope name. Use lowercase alphanumeric and hyphens.\n`);
    process.exit(1);
  }
  
  // Check if scope is already the same
  if (newScope === 'ordinarysh') {
    console.log(`${colors.yellow}[INFO]${colors.reset} This repo is already named this way :)\n`);
    process.exit(0);
  }
  
  // Show diff preview
  console.log(`\n[PREVIEW] Changes for @ordinarysh → @${newScope}:\n`);
  for (let fileIdx = 0; fileIdx < findings.length; fileIdx++) {
    const finding = findings[fileIdx];
    const newContent = replaceReferences(finding.content, newScope);
    const oldLines = finding.content.split('\n');
    const newLines = newContent.split('\n');
    
    console.log(`  ${finding.file}`);
    console.log('  ─────────────────────────────────────');
    for (let i = 0; i < oldLines.length; i++) {
      if (oldLines[i] !== newLines[i]) {
        console.log(`  ${colors.red}─${colors.reset} ${oldLines[i]}`);
        console.log(`  ${colors.green}+${colors.reset} ${newLines[i]}`);
      }
    }
    if (fileIdx < findings.length - 1) {
      console.log();
    }
  }
  console.log();

  
  // Confirm before applying
  console.log(`\n[!] This will rename all @ordinarysh/* to @${newScope}/* (${totalCount} references)\n`);
  
  const confirmed = await promptConfirmation('Continue? (y/N): ');
  
  if (!confirmed) {
    console.log('[CANCELLED]\n');
    process.exit(0);
  }
  
  // Apply changes
  const updated = applyRenaming(findings, newScope);
  
  console.log(`\n${colors.green}[OK]${colors.reset} Successfully renamed ${updated} file(s)`);
  console.log(`${colors.green}[OK]${colors.reset} All @ordinarysh/* references changed to @${newScope}/*\n`);
  console.log('[INFO] Next steps:');
  console.log('   1. Run: pnpm install');
  console.log('   2. Run: pnpm build');
  console.log('   3. Run: pnpm lint\n');
}

main().catch((err) => {
  console.error(`${colors.red}[ERROR]${colors.reset} ${err.message}`);
  process.exit(1);
});
