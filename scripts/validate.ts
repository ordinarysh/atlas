#!/usr/bin/env tsx
import { existsSync, readFileSync } from "fs";
import { join, basename, dirname } from "path";
import pc from "picocolors";
import Ajv from "ajv";
import type { ValidateFunction, ErrorObject } from "ajv";
import glob from "fast-glob";

// Initialize Ajv with strict mode and better error messages
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  verbose: true,
  allowUnionTypes: true,
});

// JSON Schema interface
interface JsonSchema {
  $schema?: string;
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

// Type-safe schema loaders
function loadSchema(schemaPath: string): JsonSchema {
  const fullPath = join(process.cwd(), schemaPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  try {
    return JSON.parse(readFileSync(fullPath, "utf-8"));
  } catch (error) {
    throw new Error(`Failed to parse schema ${schemaPath}: ${error}`);
  }
}

// Load and compile schemas with error handling
let validateTemplateManifest: ValidateFunction;
let validateAddonSteps: ValidateFunction;
let validateMigrationPlan: ValidateFunction;

try {
  const templatesSchema = loadSchema("SCHEMA.templates.json");
  const addonSchema = loadSchema("SCHEMA.addon.json");
  const migrationSchema = loadSchema("SCHEMA.migration.json");

  validateTemplateManifest = ajv.compile(templatesSchema);
  validateAddonSteps = ajv.compile(addonSchema);
  validateMigrationPlan = ajv.compile(migrationSchema);
} catch (error) {
  console.error(pc.red(`Failed to load schemas: ${error}`));
  process.exit(1);
}

// Required files for each template
const REQUIRED_TEMPLATE_FILES = [
  "atlas.json",
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  ".gitignore",
  "README.md",
  join(".github", "workflows", "ci.yml"), // Cross-platform path
];

// Helper to extract parent directory name cross-platform
function getParentDirName(filePath: string): string {
  return basename(dirname(filePath));
}

// Helper to format validation errors
function formatValidationErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors) return [];
  return errors.map((err) => {
    const path = err.instancePath || "root";
    const params = err.params ? ` (${JSON.stringify(err.params)})` : "";
    return `${path}: ${err.message}${params}`;
  });
}

async function validateTemplates() {
  const manifestPath = join(process.cwd(), "templates", "manifest.json");

  if (!existsSync(manifestPath)) {
    console.log(pc.yellow("⚠ No templates/manifest.json found - skipping template validation"));
    return true;
  }

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

    if (!validateTemplateManifest(manifest)) {
      console.error(pc.red("✗ templates/manifest.json validation failed:"));
      formatValidationErrors(validateTemplateManifest.errors).forEach((msg) => {
        console.error(pc.red(`  - ${msg}`));
      });
      return false;
    }

    console.log(pc.green("✓ templates/manifest.json is valid"));
    return true;
  } catch (error) {
    console.error(pc.red("✗ templates/manifest.json parse error:"));
    console.error(pc.red(`  ${error}`));
    return false;
  }
}

async function validateAddons() {
  const addonFiles = await glob("addons/*/steps.json", { absolute: true });

  if (addonFiles.length === 0) {
    console.log(pc.yellow("⚠ No addons found - skipping addon validation"));
    return true;
  }

  let allValid = true;

  for (const addonPath of addonFiles) {
    const addonName = getParentDirName(addonPath);

    try {
      const addon = JSON.parse(readFileSync(addonPath, "utf-8"));

      if (!validateAddonSteps(addon)) {
        allValid = false;
        console.error(pc.red(`✗ addons/${addonName}/steps.json validation failed:`));
        formatValidationErrors(validateAddonSteps.errors).forEach((msg) => {
          console.error(pc.red(`  - ${msg}`));
        });
      } else {
        console.log(pc.green(`✓ addons/${addonName}/steps.json is valid`));
      }
    } catch (error) {
      allValid = false;
      console.error(pc.red(`✗ addons/${addonName}/steps.json parse error:`));
      console.error(pc.red(`  ${error}`));
    }
  }

  return allValid;
}

async function validateMigrations() {
  const migrationFiles = await glob("migrations/*/plan.json", { absolute: true });

  if (migrationFiles.length === 0) {
    console.log(pc.yellow("⚠ No migrations found - skipping migration validation"));
    return true;
  }

  let allValid = true;

  for (const planPath of migrationFiles) {
    const migrationName = getParentDirName(planPath);

    try {
      const plan = JSON.parse(readFileSync(planPath, "utf-8"));

      if (!validateMigrationPlan(plan)) {
        allValid = false;
        console.error(pc.red(`✗ migrations/${migrationName}/plan.json validation failed:`));
        formatValidationErrors(validateMigrationPlan.errors).forEach((msg) => {
          console.error(pc.red(`  - ${msg}`));
        });
      } else {
        console.log(pc.green(`✓ migrations/${migrationName}/plan.json is valid`));
      }
    } catch (error) {
      allValid = false;
      console.error(pc.red(`✗ migrations/${migrationName}/plan.json parse error:`));
      console.error(pc.red(`  ${error}`));
    }
  }

  return allValid;
}

async function validateTemplateStructure() {
  const templateDirs = await glob("templates/*/", {
    onlyDirectories: true,
    absolute: false,
  });

  if (templateDirs.length === 0) {
    console.log(pc.yellow("⚠ No template directories found"));
    return true;
  }

  let allValid = true;

  for (const templateDir of templateDirs) {
    const templateName = basename(templateDir);

    // Skip manifest.json if it exists as a file
    if (templateName === "manifest.json") continue;

    console.log(pc.cyan(`\nChecking template: ${templateName}`));

    // Check required files
    for (const requiredFile of REQUIRED_TEMPLATE_FILES) {
      const filePath = join(templateDir, requiredFile);

      if (!existsSync(filePath)) {
        allValid = false;
        console.error(pc.red(`  ✗ Missing required file: ${requiredFile}`));
      } else {
        console.log(pc.green(`  ✓ ${requiredFile} exists`));
      }
    }

    // Guard against node_modules
    const nodeModulesPath = join(templateDir, "node_modules");
    if (existsSync(nodeModulesPath)) {
      allValid = false;
      console.error(pc.red(`  ✗ Found node_modules/ - this should not be committed`));
    }

    // Guard against pnpm-lock.yaml
    const pnpmLockPath = join(templateDir, "pnpm-lock.yaml");
    if (existsSync(pnpmLockPath)) {
      allValid = false;
      console.error(pc.red(`  ✗ Found pnpm-lock.yaml - lockfile should not be in template source`));
    }

    // Guard against .turbo directory
    const turboPath = join(templateDir, ".turbo");
    if (existsSync(turboPath)) {
      allValid = false;
      console.error(pc.red(`  ✗ Found .turbo/ - build cache should not be committed`));
    }

    // Guard against .next directory
    const nextPaths = await glob("**/.next", {
      cwd: templateDir,
      dot: true,
      onlyDirectories: true,
      absolute: false,
    });

    if (nextPaths.length > 0) {
      allValid = false;
      console.error(
        pc.red(`  ✗ Found .next/ directories - Next.js build output should not be committed`),
      );
    }

    // Guard against dist directories
    const distPaths = await glob("**/dist", {
      cwd: templateDir,
      onlyDirectories: true,
      absolute: false,
    });

    if (distPaths.length > 0) {
      allValid = false;
      console.error(pc.red(`  ✗ Found dist/ directories - build outputs should not be committed`));
    }

    // Guard against *.tsbuildinfo files
    const tsBuildInfoFiles = await glob("**/*.tsbuildinfo", {
      cwd: templateDir,
      absolute: false,
    });

    if (tsBuildInfoFiles.length > 0) {
      allValid = false;
      console.error(
        pc.red(
          `  ✗ Found .tsbuildinfo files: ${tsBuildInfoFiles.join(", ")} - TypeScript build cache should not be committed`,
        ),
      );
    }

    // Guard against .env files (except .env.example)
    const envFiles = await glob(".env*", {
      cwd: templateDir,
      dot: true,
      ignore: [".env.example"],
      absolute: false,
    });

    if (envFiles.length > 0) {
      allValid = false;
      console.error(
        pc.red(`  ✗ Found .env files: ${envFiles.join(", ")} - these should not be committed`),
      );
    }
  }

  return allValid;
}

async function validateSchemas() {
  const schemaFiles = ["SCHEMA.templates.json", "SCHEMA.addon.json", "SCHEMA.migration.json"];
  let allValid = true;

  console.log(pc.cyan("Validating schema files..."));

  for (const schemaFile of schemaFiles) {
    const schemaPath = join(process.cwd(), schemaFile);

    if (!existsSync(schemaPath)) {
      allValid = false;
      console.error(pc.red(`✗ Missing schema file: ${schemaFile}`));
      continue;
    }

    try {
      const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));

      // Validate it's a valid JSON Schema
      if (!schema.$schema || !schema.$id) {
        allValid = false;
        console.error(pc.red(`✗ ${schemaFile} is missing $schema or $id`));
      } else if (schema.type !== "object") {
        allValid = false;
        console.error(pc.red(`✗ ${schemaFile} root type must be 'object'`));
      } else if (!Array.isArray(schema.required) || schema.required.length === 0) {
        allValid = false;
        console.error(pc.red(`✗ ${schemaFile} must have required fields`));
      } else {
        console.log(pc.green(`✓ ${schemaFile} is valid`));
      }
    } catch (error) {
      allValid = false;
      console.error(pc.red(`✗ ${schemaFile} parse error: ${error}`));
    }
  }

  return allValid;
}

async function main() {
  console.log(pc.bold("\n🔍 Validating Atlas Repository\n"));

  // Run validations sequentially for better error reporting
  const schemaValid = await validateSchemas();
  if (!schemaValid) {
    console.log(pc.bold(pc.red("\n❌ Schema validation failed. Fix schemas first.\n")));
    process.exit(1);
  }

  // Run the rest in parallel
  const results = await Promise.all([
    validateTemplates(),
    validateAddons(),
    validateMigrations(),
    validateTemplateStructure(),
  ]);

  const allValid = results.every(Boolean);

  if (allValid) {
    console.log(pc.bold(pc.green("\n✅ All validations passed!\n")));
    process.exit(0);
  } else {
    console.log(pc.bold(pc.red("\n❌ Validation failed. Please fix the issues above.\n")));
    process.exit(1);
  }
}

// Handle errors gracefully
process.on("unhandledRejection", (error) => {
  console.error(pc.red("Unhandled error:"), error);
  process.exit(1);
});

main().catch((error) => {
  console.error(pc.red("Unexpected error:"), error);
  process.exit(1);
});
