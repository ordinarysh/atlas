import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";

const execAsync = promisify(exec);

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function runCommand(
  command: string,
  cwd?: string,
  env?: Record<string, string>
): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, ...env },
      encoding: "utf-8",
    });
    
    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string; code?: number };
    return {
      stdout: execError.stdout?.trim() || "",
      stderr: execError.stderr?.trim() || execError.message || "Unknown error",
      exitCode: execError.code || 1,
    };
  }
}

export async function runPnpmInstall(projectPath: string): Promise<RunResult> {
  return runCommand("pnpm install --no-frozen-lockfile", projectPath);
}

export async function runPnpmScript(
  projectPath: string,
  scriptName: string
): Promise<RunResult> {
  return runCommand(`pnpm run ${scriptName}`, projectPath);
}

export async function runTemplateInit(
  templatePath: string,
  targetPath: string
): Promise<RunResult> {
  // Simulate template initialization
  return runCommand(`cp -r "${templatePath}"/* "${targetPath}"/`, targetPath);
}

export async function runAddonInstall(
  addonPath: string,
  projectPath: string
): Promise<RunResult> {
  // Simulate addon installation
  const _addonStepsPath = join(addonPath, "steps.json");
  return runCommand(`node -e "console.log('Installing addon...')"`, projectPath);
}

export async function runMigration(
  migrationPath: string,
  projectPath: string
): Promise<RunResult> {
  // Simulate migration
  const _planPath = join(migrationPath, "plan.json");
  return runCommand(`node -e "console.log('Running migration...')"`, projectPath);
}