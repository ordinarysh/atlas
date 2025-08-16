#!/usr/bin/env tsx

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = process.cwd();
const TEMPLATE_DIR = join(ROOT_DIR, "templates/full");

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function runTest(name: string, testFn: () => boolean | string): void {
  try {
    const result = testFn();
    if (result === true) {
      results.push({ name, passed: true, message: "✅ Passed" });
    } else {
      results.push({ name, passed: false, message: `❌ Failed: ${result}` });
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

function execCommand(cmd: string, cwd: string = ROOT_DIR): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf-8", stdio: "pipe" });
  } catch (error) {
    if (error instanceof Error && "stdout" in error) {
      return (error as unknown as { stdout: string }).stdout || "";
    }
    throw error;
  }
}

console.log("🔍 Testing Template Isolation\n");
console.log("=".repeat(50));

// Test 1: Verify root ESLint ignores templates
runTest("Root ESLint ignores templates/**", () => {
  const eslintConfig = readFileSync(join(ROOT_DIR, "eslint.config.mjs"), "utf-8");
  return eslintConfig.includes("ignores: [") && eslintConfig.includes('"templates/**"')
    ? true
    : "templates/** not found in eslint ignores";
});

// Test 2: Verify root Prettier ignores templates
runTest("Root Prettier ignores templates/**", () => {
  const prettierIgnore = readFileSync(join(ROOT_DIR, ".prettierignore"), "utf-8");
  return prettierIgnore.includes("templates/**")
    ? true
    : "templates/** not found in .prettierignore";
});

// Test 3: Verify root TypeScript excludes templates
runTest("Root TypeScript excludes templates", () => {
  const tsconfig = JSON.parse(readFileSync(join(ROOT_DIR, "tsconfig.json"), "utf-8"));
  const includes = tsconfig.include || [];
  return !includes.some((p: string) => p.includes("templates"))
    ? true
    : "templates found in tsconfig.json includes";
});

// Test 4: Verify lint-staged ignores templates
runTest("Lint-staged ignores templates/**", () => {
  const lintStaged = readFileSync(join(ROOT_DIR, ".lintstagedrc.mjs"), "utf-8");
  return lintStaged.includes("ignore: ['templates/**']")
    ? true
    : "templates/** not found in lint-staged ignore";
});

// Test 5: Verify pre-commit hook handles templates
runTest("Pre-commit hook skips template-only commits", () => {
  const preCommit = readFileSync(join(ROOT_DIR, ".husky/pre-commit"), "utf-8");
  return preCommit.includes("grep -qv '^templates/'")
    ? true
    : "Template skip logic not found in pre-commit";
});

// Test 6: Verify pnpm workspace doesn't include templates
runTest("Root pnpm workspace excludes templates", () => {
  const workspace = readFileSync(join(ROOT_DIR, "pnpm-workspace.yaml"), "utf-8");
  return !workspace.includes("templates") ? true : "templates found in pnpm-workspace.yaml";
});

// Test 7: Verify template has its own configs
runTest("Template has independent configs", () => {
  const configs = [
    "eslint.config.mjs",
    ".prettierrc",
    ".lintstagedrc.mjs",
    "tsconfig.json",
    "pnpm-workspace.yaml",
  ];

  for (const config of configs) {
    if (!existsSync(join(TEMPLATE_DIR, config))) {
      return `Missing ${config} in template`;
    }
  }
  return true;
});

// Test 8: Mock root lint command
runTest("Root lint runs only on root files", () => {
  const output = execCommand(
    "npx eslint . --max-warnings 0 --debug 2>&1 | grep 'Linting\\|Ignore' | head -20",
  );
  return !output.includes("templates/full") ? true : "Root ESLint is processing template files";
});

// Test 9: Mock root typecheck
runTest("Root typecheck excludes templates", () => {
  const output = execCommand(
    "npx tsc -p tsconfig.json --listFiles 2>&1 | grep 'templates/' || echo 'No template files'",
  );
  return output.includes("No template files") ? true : "TypeScript is including template files";
});

// Test 10: Verify CI workflow configuration
runTest("CI workflow properly configured", () => {
  const ci = readFileSync(join(ROOT_DIR, ".github/workflows/ci.yml"), "utf-8");
  const hasLintExclusion = ci.includes("Run ESLint (excluding templates)");
  const hasTypecheckExclusion = ci.includes("Run TypeScript type checking (excluding templates)");
  const hasSmokeTest = ci.includes("Extract and test full template");

  if (!hasLintExclusion) return "Missing lint exclusion comment in CI";
  if (!hasTypecheckExclusion) return "Missing typecheck exclusion comment in CI";
  if (!hasSmokeTest) return "Missing template smoke test in CI";

  return true;
});

// Test 11: Verify template can run independently
runTest("Template configs are valid", () => {
  // Check if template ESLint config is valid JavaScript
  try {
    const eslintConfig = readFileSync(join(TEMPLATE_DIR, "eslint.config.mjs"), "utf-8");
    if (!eslintConfig.includes("export default")) {
      return "Invalid ESLint config format";
    }
    return true;
  } catch (error) {
    return `Error reading template ESLint config: ${error}`;
  }
});

// Test 12: Check for config file conflicts
runTest("No .tpl files remaining", () => {
  const output = execCommand("find templates -name '*.tpl' 2>/dev/null | head -5");
  return output.trim() === "" ? true : `Found .tpl files: ${output.trim()}`;
});

// Print results
console.log("\n📊 Test Results:\n");
console.log("=".repeat(50));

let passed = 0;
let failed = 0;

for (const result of results) {
  console.log(`${result.passed ? "✅" : "❌"} ${result.name}`);
  if (!result.passed) {
    console.log(`   └─ ${result.message}`);
    failed++;
  } else {
    passed++;
  }
}

console.log("\n" + "=".repeat(50));
console.log(`Summary: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log("\n⚠️  Some isolation tests failed. Review the results above.");
  process.exit(1);
} else {
  console.log("\n✨ All isolation tests passed! Templates are properly isolated.");
}
