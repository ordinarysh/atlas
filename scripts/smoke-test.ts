#!/usr/bin/env tsx
/**
 * CI Smoke Test for Atlas Templates
 *
 * This script validates that templates can be extracted, installed, and built
 * successfully in a clean environment. It's designed to catch issues that
 * would prevent users from using the templates after download.
 *
 * Usage: tsx scripts/smoke-test.ts [template-name] [version]
 */

import { mkdir, stat, rm } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { execSync } from "child_process";
import { tmpdir } from "os";
import pc from "picocolors";
import { createHash } from "crypto";

interface SmokeTestConfig {
  templateName: string;
  version: string;
  timeout: number;
  skipBuild: boolean;
}

interface TestResult {
  success: boolean;
  step: string;
  error?: string;
  duration: number;
  logs?: string[];
}

class SmokeTestRunner {
  private tempDir: string = "";
  private startTime: number = 0;
  private logs: string[] = [];

  constructor(private config: SmokeTestConfig) {}

  /**
   * Run the complete smoke test suite
   */
  async run(): Promise<boolean> {
    console.log(pc.bold(`\n🧪 Atlas Template Smoke Test\n`));
    console.log(pc.cyan(`Template: ${this.config.templateName}`));
    console.log(pc.cyan(`Version: ${this.config.version}`));
    console.log(pc.cyan(`Timeout: ${this.config.timeout}ms\n`));

    const steps = [
      { name: "Setup", fn: this.setupTempDirectory.bind(this) },
      { name: "Extract", fn: this.extractTemplate.bind(this) },
      { name: "Install", fn: this.installDependencies.bind(this) },
      { name: "TypeCheck", fn: this.runTypeCheck.bind(this) },
      { name: "Lint", fn: this.runLinting.bind(this) },
      ...(this.config.skipBuild
        ? []
        : [
            { name: "Build", fn: this.runBuild.bind(this) },
            { name: "Test", fn: this.runTests.bind(this) },
          ]),
      { name: "Cleanup", fn: this.cleanup.bind(this) },
    ];

    let allPassed = true;
    const results: TestResult[] = [];

    for (const step of steps) {
      const result = await this.runStep(step.name, step.fn);
      results.push(result);

      if (!result.success) {
        allPassed = false;
        console.error(pc.red(`\n💥 Smoke test failed at step: ${step.name}`));
        if (result.error) {
          console.error(pc.red(`Error: ${result.error}`));
        }
        break;
      }
    }

    this.printResults(results);

    // Always attempt cleanup
    try {
      await this.cleanup();
    } catch (error) {
      console.warn(pc.yellow(`⚠️ Cleanup warning: ${error}`));
    }

    return allPassed;
  }

  /**
   * Run a single test step with timing and error handling
   */
  private async runStep(name: string, fn: () => Promise<void>): Promise<TestResult> {
    const start = Date.now();
    this.log(`Starting ${name}...`);

    try {
      await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${this.config.timeout}ms`)),
            this.config.timeout,
          ),
        ),
      ]);

      const duration = Date.now() - start;
      console.log(pc.green(`  ✓ ${name} (${duration}ms)`));

      return {
        success: true,
        step: name,
        duration,
        logs: [...this.logs],
      };
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error(pc.red(`  ✗ ${name} failed (${duration}ms)`));

      return {
        success: false,
        step: name,
        error: errorMessage,
        duration,
        logs: [...this.logs],
      };
    }
  }

  /**
   * Setup a temporary directory for testing
   */
  private async setupTempDirectory(): Promise<void> {
    const randomSuffix = createHash("md5")
      .update(`${Date.now()}-${Math.random()}`)
      .digest("hex")
      .substring(0, 8);

    this.tempDir = join(tmpdir(), `atlas-smoke-${randomSuffix}`);
    await mkdir(this.tempDir, { recursive: true });
    this.log(`Created temp directory: ${this.tempDir}`);
  }

  /**
   * Extract the template archive to temp directory
   */
  private async extractTemplate(): Promise<void> {
    const archiveName = `atlas-${this.config.templateName}-v${this.config.version}.tar.gz`;
    const archivePath = join(process.cwd(), "release", archiveName);

    if (!existsSync(archivePath)) {
      throw new Error(`Template archive not found: ${archivePath}`);
    }

    // Extract using tar
    this.execInTemp(`tar -xzf "${archivePath}" --strip-components=0`);
    this.log(`Extracted ${archiveName}`);

    // Verify extraction
    const extractedPath = join(this.tempDir, `atlas-${this.config.templateName}`);
    if (!existsSync(extractedPath)) {
      throw new Error(`Template not extracted correctly to ${extractedPath}`);
    }

    // Change working directory to extracted template
    process.chdir(extractedPath);
    this.log(`Changed to directory: ${extractedPath}`);
  }

  /**
   * Install dependencies using pnpm
   */
  private async installDependencies(): Promise<void> {
    // Verify package.json exists
    if (!existsSync("package.json")) {
      throw new Error("package.json not found in extracted template");
    }

    // Install dependencies
    this.exec("pnpm install --frozen-lockfile=false --no-optional");
    this.log("Dependencies installed successfully");

    // Verify node_modules was created
    if (!existsSync("node_modules")) {
      throw new Error("node_modules directory not created after install");
    }
  }

  /**
   * Run TypeScript type checking
   */
  private async runTypeCheck(): Promise<void> {
    this.exec("pnpm run type-check");
    this.log("Type checking passed");
  }

  /**
   * Run ESLint
   */
  private async runLinting(): Promise<void> {
    this.exec("pnpm run lint");
    this.log("Linting passed");
  }

  /**
   * Run build process
   */
  private async runBuild(): Promise<void> {
    // Set build environment variable for smoke testing
    process.env.BUILD_SMOKE = "1";

    this.exec("pnpm run build");
    this.log("Build completed successfully");

    // Verify build outputs exist
    const buildDirs = ["apps/web/.next", "packages/ui/dist"];
    for (const dir of buildDirs) {
      if (existsSync(dir)) {
        const stats = await stat(dir);
        if (!stats.isDirectory()) {
          throw new Error(`Expected build output ${dir} is not a directory`);
        }
        this.log(`Verified build output: ${dir}`);
      }
    }
  }

  /**
   * Run test suite
   */
  private async runTests(): Promise<void> {
    // Run tests with --run flag to avoid watch mode
    this.exec("pnpm run test --run");
    this.log("Tests passed");
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(): Promise<void> {
    if (this.tempDir && existsSync(this.tempDir)) {
      // Change back to original directory before cleanup
      process.chdir(process.cwd());

      await rm(this.tempDir, { recursive: true, force: true });
      this.log(`Cleaned up temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Execute command with error handling
   */
  private exec(command: string): void {
    try {
      const output = execSync(command, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: this.config.timeout,
      });
      this.log(`Command executed: ${command}`);
      this.log(`Output: ${output.trim()}`);
    } catch (error: unknown) {
      const execError = error as { stderr?: unknown; stdout?: unknown };
      const stderr = execError.stderr?.toString() || "";
      const stdout = execError.stdout?.toString() || "";
      this.log(`Command failed: ${command}`);
      this.log(`stdout: ${stdout}`);
      this.log(`stderr: ${stderr}`);
      throw new Error(`Command failed: ${command}\n${stderr || stdout}`);
    }
  }

  /**
   * Execute command in temp directory
   */
  private execInTemp(command: string): void {
    const originalCwd = process.cwd();
    try {
      process.chdir(this.tempDir);
      this.exec(command);
    } finally {
      process.chdir(originalCwd);
    }
  }

  /**
   * Add log entry
   */
  private log(message: string): void {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
  }

  /**
   * Print test results summary
   */
  private printResults(results: TestResult[]): void {
    console.log(pc.bold("\n📊 Smoke Test Results:"));

    let totalDuration = 0;
    let passed = 0;

    for (const result of results) {
      totalDuration += result.duration;
      if (result.success) {
        passed++;
        console.log(pc.green(`  ✓ ${result.step} (${result.duration}ms)`));
      } else {
        console.log(pc.red(`  ✗ ${result.step} (${result.duration}ms)`));
        if (result.error) {
          console.log(pc.red(`    Error: ${result.error}`));
        }
      }
    }

    console.log(pc.cyan(`\nTotal: ${passed}/${results.length} passed in ${totalDuration}ms`));

    if (passed === results.length) {
      console.log(pc.bold(pc.green("\n✅ All smoke tests passed!")));
    } else {
      console.log(pc.bold(pc.red("\n❌ Some smoke tests failed!")));
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): SmokeTestConfig {
  const args = process.argv.slice(2);

  const templateName = args[0] || "full";
  const version = args[1] || "0.0.0";
  const timeout = parseInt(process.env.SMOKE_TIMEOUT || "300000", 10); // 5 minutes default
  const skipBuild = process.env.BUILD_SMOKE === "skip" || args.includes("--skip-build");

  return { templateName, version, timeout, skipBuild };
}

/**
 * Main execution
 */
async function main() {
  const config = parseArgs();
  const runner = new SmokeTestRunner(config);

  try {
    const success = await runner.run();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(pc.red(`\n💥 Smoke test crashed: ${error}`));
    process.exit(1);
  }
}

// Handle process signals for cleanup
process.on("SIGINT", () => {
  console.log(pc.yellow("\n⚠️ Smoke test interrupted"));
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log(pc.yellow("\n⚠️ Smoke test terminated"));
  process.exit(1);
});

main().catch((error) => {
  console.error(pc.red(`Smoke test error: ${error}`));
  process.exit(1);
});
