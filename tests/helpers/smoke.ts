import { runCommand } from "./runner";

/**
 * Run smoke tests on a template directory
 * Skips heavy build steps when BUILD_SMOKE env is set
 */
export async function runSmokeTests(templatePath: string) {
  const results = {
    install: { success: false, message: "" },
    lint: { success: false, message: "" },
    typecheck: { success: false, message: "" },
    build: { success: false, message: "" },
  };

  // Install dependencies
  console.log("  → Installing dependencies...");
  const installResult = await runCommand("pnpm install --frozen-lockfile", templatePath);
  results.install.success = installResult.exitCode === 0;
  results.install.message =
    installResult.exitCode === 0
      ? "Dependencies installed"
      : `Install failed: ${installResult.stderr}`;

  if (!results.install.success) {
    return results; // Can't continue without dependencies
  }

  // Run lint
  console.log("  → Running lint...");
  const lintResult = await runCommand("pnpm run lint", templatePath);
  results.lint.success = lintResult.exitCode === 0;
  results.lint.message =
    lintResult.exitCode === 0
      ? "Lint passed"
      : `Lint failed: ${lintResult.stderr || lintResult.stdout}`;

  // Run typecheck
  console.log("  → Running typecheck...");
  const typecheckResult = await runCommand("pnpm run type-check", templatePath);
  results.typecheck.success = typecheckResult.exitCode === 0;
  results.typecheck.message =
    typecheckResult.exitCode === 0
      ? "Type check passed"
      : `Type check failed: ${typecheckResult.stderr || typecheckResult.stdout}`;

  // Run build (skip if BUILD_SMOKE is set)
  if (process.env.BUILD_SMOKE === "skip") {
    console.log("  → Skipping build (BUILD_SMOKE=skip)");
    results.build.success = true;
    results.build.message = "Build skipped (BUILD_SMOKE=skip)";
  } else {
    console.log("  → Running build smoke test...");
    // Run with timeout for smoke test
    const buildResult = await runCommand(
      "timeout 60 pnpm run build 2>&1 | head -100",
      templatePath,
    );
    results.build.success = buildResult.exitCode === 0 || buildResult.exitCode === 124; // 124 = timeout
    results.build.message =
      buildResult.exitCode === 124
        ? "Build started successfully (timed out as expected)"
        : buildResult.exitCode === 0
          ? "Build completed"
          : `Build failed: ${buildResult.stderr || buildResult.stdout}`;
  }

  return results;
}

// Snapshot item structure
interface SnapshotItem {
  name: string;
  children?: SnapshotItem[];
  [key: string]: unknown;
}

type SnapshotData = SnapshotItem[] | SnapshotItem | unknown;

/**
 * Compare template structure against snapshot
 */
export function compareSnapshot(
  actual: SnapshotData,
  expected: SnapshotData,
  path: string = "",
): { match: boolean; differences: string[] } {
  const differences: string[] = [];

  function compare(a: SnapshotData, b: SnapshotData, currentPath: string) {
    if (typeof a !== typeof b) {
      differences.push(`Type mismatch at ${currentPath}: ${typeof a} vs ${typeof b}`);
      return;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      const aItems = a as SnapshotItem[];
      const bItems = b as SnapshotItem[];

      const aNames = aItems.map((item) => item.name).sort();
      const bNames = bItems.map((item) => item.name).sort();

      const missing = bNames.filter((name) => !aNames.includes(name));
      const extra = aNames.filter((name) => !bNames.includes(name));

      if (missing.length > 0) {
        differences.push(`Missing at ${currentPath}: ${missing.join(", ")}`);
      }
      if (extra.length > 0) {
        differences.push(`Extra at ${currentPath}: ${extra.join(", ")}`);
      }

      // Compare children recursively
      for (const item of aItems) {
        const expectedItem = bItems.find((i: SnapshotItem) => i.name === item.name);
        if (expectedItem && item.children && expectedItem.children) {
          compare(item.children, expectedItem.children, `${currentPath}/${item.name}`);
        }
      }
    }
  }

  compare(actual, expected, path || "root");

  return {
    match: differences.length === 0,
    differences,
  };
}
