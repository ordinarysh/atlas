#!/usr/bin/env node
/**
 * Post-extraction script to restore dotfile configurations
 *
 * When the Atlas template is extracted, certain configuration files are stored with .tpl
 * extensions to prevent them from interfering with the parent repository's tooling.
 * This script restores them to their proper dotfile names.
 *
 * Usage:
 *   node scripts/post-extract.mjs
 *
 * This will be called automatically by the Atlas CLI during template generation.
 */

import { readdir, rename, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mapping of template files to their final dotfile names
const DOTFILE_MAP = {
  "lintstagedrc.mjs.tpl": ".lintstagedrc.mjs",
  "prettierrc.tpl": ".prettierrc",
  "eslint.config.mjs.tpl": "eslint.config.mjs", // Not a dotfile, but needs restoration
};

async function restoreDotfiles() {
  const projectRoot = join(__dirname, "..");

  console.log("🔧 Restoring template configuration files...");

  try {
    const entries = await readdir(projectRoot);
    let restoredCount = 0;

    for (const filename of entries) {
      if (DOTFILE_MAP[filename]) {
        const sourcePath = join(projectRoot, filename);
        const targetPath = join(projectRoot, DOTFILE_MAP[filename]);

        // Check if source file exists
        try {
          await access(sourcePath);
          await rename(sourcePath, targetPath);
          console.log(`  ✅ ${filename} → ${DOTFILE_MAP[filename]}`);
          restoredCount++;
        } catch (error) {
          console.warn(`  ⚠️  Could not restore ${filename}: ${error.message}`);
        }
      }
    }

    if (restoredCount > 0) {
      console.log(`\n✅ Successfully restored ${restoredCount} configuration file(s).`);
      console.log("\nYour project is now ready with proper tooling configurations!");
      console.log("\nNext steps:");
      console.log("  1. Run: pnpm install");
      console.log("  2. Run: pnpm dev:web (to start the web app)");
      console.log("  3. See docs/setup/GETTING_STARTED.md for more information");
    } else {
      console.log("ℹ️  No template files found to restore.");
    }
  } catch (error) {
    console.error("❌ Error restoring dotfiles:", error.message);
    process.exit(1);
  }
}

// Only run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  restoreDotfiles();
}

export { restoreDotfiles, DOTFILE_MAP };
