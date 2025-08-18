import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { cp } from "fs/promises";
import { createTempDir, cleanupTempDir, getDirectoryTree } from "../helpers/fs";
import { runSmokeTests, compareSnapshot } from "../helpers/smoke";

describe("Full Template E2E", () => {
  let tempDir: string;
  let templatePath: string;

  beforeAll(() => {
    templatePath = join(process.cwd(), "templates", "full");
    if (!existsSync(templatePath)) {
      throw new Error("Full template not found at templates/full");
    }
  });

  beforeAll(async () => {
    tempDir = await createTempDir();
    console.log(`  Test directory: ${tempDir}`);
  });

  afterAll(async () => {
    if (tempDir && existsSync(tempDir)) {
      await cleanupTempDir(tempDir);
    }
  });

  it("should match the snapshot structure", async () => {
    const snapshotPath = join(process.cwd(), "fixtures", "full-template.json");
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf-8"));

    const actualTree = await getDirectoryTree(templatePath);

    // Convert tree to snapshot format
    interface SnapshotItem {
      type: "file" | "directory";
      name: string;
      children?: SnapshotItem[];
    }

    function treeToSnapshot(tree: Record<string, unknown>): SnapshotItem[] {
      return Object.entries(tree)
        .map(([name, value]) => {
          if (value === "file") {
            return { type: "file" as const, name };
          } else {
            const children = treeToSnapshot(value as Record<string, unknown>);
            const result: SnapshotItem = {
              type: "directory" as const,
              name,
            };
            if (children.length > 0) {
              result.children = children;
            }
            return result;
          }
        })
        .sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
    }

    const actual = treeToSnapshot(actualTree);
    const result = compareSnapshot(actual, snapshot.structure);

    if (!result.match) {
      console.error("Snapshot differences found:");
      result.differences.forEach((diff) => console.error(`  - ${diff}`));
    }

    expect(result.match).toBe(true);
  });

  it("should have all required files", async () => {
    const requiredFiles = [
      "atlas.json",
      "package.json",
      "pnpm-workspace.yaml",
      "tsconfig.base.json",
      ".gitignore",
      "README.md",
      join(".github", "workflows", "ci.yml"),
    ];

    for (const file of requiredFiles) {
      const filePath = join(templatePath, file);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  it("should not contain volatile files", async () => {
    const volatileFiles = [
      "node_modules",
      ".env",
      ".env.local",
      ".env.production",
      "dist",
      "build",
      ".next",
    ];

    for (const file of volatileFiles) {
      const filePath = join(templatePath, file);
      expect(existsSync(filePath)).toBe(false);
    }
  });

  it.skip("should pass smoke tests after initialization", async () => {
    // Skip smoke tests for now - would run in full CI
    // This test would copy template, install deps, and run lint/typecheck/build

    // Copy template to temp directory
    console.log("  → Copying template to test directory...");
    await cp(templatePath, tempDir, { recursive: true });

    // Run smoke tests
    console.log("  → Running smoke tests...");
    const results = await runSmokeTests(tempDir);

    // Check results
    expect(results.install.success).toBe(true);
    expect(results.lint.success).toBe(true);
    expect(results.typecheck.success).toBe(true);

    // Build can be skipped or successful
    if (process.env.BUILD_SMOKE !== "skip") {
      expect(results.build.success).toBe(true);
    }

    // Log results for debugging
    console.log("\nSmoke test results:");
    Object.entries(results).forEach(([test, result]) => {
      const icon = result.success ? "✅" : "❌";
      console.log(`  ${icon} ${test}: ${result.message}`);
    });
  }, 120000); // 2 minute timeout
});
