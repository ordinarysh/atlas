#!/usr/bin/env tsx
import { readFile, writeFile } from "fs/promises";
import pc from "picocolors";

/**
 * Sync versions across all template files
 * Called by semantic-release during the prepare step
 */
async function main() {
  const version = process.argv[2];

  if (!version) {
    console.error(pc.red("❌ Version required as first argument"));
    process.exit(1);
  }

  console.log(pc.cyan(`🔄 Syncing version ${version} across templates...`));

  try {
    // Track updated files
    const updatedFiles: string[] = [];

    // Helper to update JSON files
    async function updateJsonFile(path: string, updates: Record<string, unknown>) {
      const content = JSON.parse(await readFile(path, "utf-8"));
      Object.assign(content, updates);
      await writeFile(path, JSON.stringify(content, null, 2) + "\n");
      updatedFiles.push(path);
      console.log(pc.green(`  ✅ Updated ${path}`));
    }

    // Update template package.json files
    const templatePaths = ["templates/full/package.json"];

    for (const templatePath of templatePaths) {
      try {
        await updateJsonFile(templatePath, { version });
      } catch (error) {
        console.warn(pc.yellow(`  ⚠️  Could not update ${templatePath}: ${error}`));
      }
    }

    // Update atlas.json files
    const atlasFiles = ["templates/full/atlas.json"];

    for (const atlasFile of atlasFiles) {
      try {
        await updateJsonFile(atlasFile, { version });
      } catch (error) {
        console.warn(pc.yellow(`  ⚠️  Could not update ${atlasFile}: ${error}`));
      }
    }

    // Create version file for build script
    await writeFile(".VERSION", version);
    updatedFiles.push(".VERSION");
    console.log(pc.green(`  ✅ Created .VERSION file`));

    // Summary
    console.log(pc.bold(pc.green(`\n✨ Successfully synced version ${version}`)));
    console.log(pc.gray(`   Updated ${updatedFiles.length} files:`));
    updatedFiles.forEach((file) => {
      console.log(pc.gray(`   - ${file}`));
    });
  } catch (error) {
    console.error(pc.red(`❌ Failed to sync versions:`));
    console.error(pc.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(pc.red("Unhandled error:"), error);
  process.exit(1);
});
