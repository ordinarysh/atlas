#!/usr/bin/env tsx
import { readFile, writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import pc from "picocolors";
import glob from "fast-glob";

/**
 * Optional script to generate preset templates (web, api) from full template
 * This is a safe no-op if not used - just provides a helper for deriving templates
 */

async function copyDirectory(src: string, dest: string, ignore: string[] = []) {
  await mkdir(dest, { recursive: true });

  const files = await glob("**/*", {
    cwd: src,
    dot: true,
    ignore: [
      "node_modules/**",
      ".git/**",
      ".DS_Store",
      "*.log",
      ".turbo/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ...ignore,
    ],
  });

  for (const file of files) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);

    // Ensure directory exists
    const dir = destPath.substring(0, destPath.lastIndexOf("/"));
    await mkdir(dir, { recursive: true });

    // Copy file
    const content = await readFile(srcPath);
    await writeFile(destPath, content);
  }
}

async function generateWebTemplate() {
  const fullPath = join(process.cwd(), "templates", "full");
  const webPath = join(process.cwd(), "templates", "web");

  if (!existsSync(fullPath)) {
    console.log(pc.yellow("⚠ Full template not found - skipping web generation"));
    return;
  }

  console.log(pc.cyan("📦 Generating web template from full..."));

  // Clean existing web template
  await rm(webPath, { recursive: true, force: true });

  // Copy full to web
  await copyDirectory(fullPath, webPath, [
    "services/**", // Exclude backend services
    "packages/api/**", // Exclude API packages
  ]);

  // Modify package.json for web preset
  const pkgPath = join(webPath, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    pkg.name = "@atlas/web";
    pkg.description = "Atlas Web Application Template";
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  }

  console.log(pc.green("✓ Web template generated"));
}

async function generateApiTemplate() {
  const fullPath = join(process.cwd(), "templates", "full");
  const apiPath = join(process.cwd(), "templates", "api");

  if (!existsSync(fullPath)) {
    console.log(pc.yellow("⚠ Full template not found - skipping API generation"));
    return;
  }

  console.log(pc.cyan("📦 Generating API template from full..."));

  // Clean existing API template
  await rm(apiPath, { recursive: true, force: true });

  // Copy full to API
  await copyDirectory(fullPath, apiPath, [
    "apps/**", // Exclude frontend apps
    "packages/ui/**", // Exclude UI packages
  ]);

  // Modify package.json for API preset
  const pkgPath = join(apiPath, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    pkg.name = "@atlas/api";
    pkg.description = "Atlas API Template";
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  }

  console.log(pc.green("✓ API template generated"));
}

async function main() {
  console.log(pc.bold("\n🎨 Generating Template Presets\n"));

  try {
    await generateWebTemplate();
    await generateApiTemplate();

    console.log(pc.bold(pc.green("\n✨ Preset generation complete!\n")));
  } catch (error) {
    console.error(pc.red("Generation failed:"), error);
    process.exit(1);
  }
}

// Check if being run directly or as a module
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { generateWebTemplate, generateApiTemplate };
