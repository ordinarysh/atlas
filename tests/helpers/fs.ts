import { mkdir, rm, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { execSync } from "child_process";

export async function createTempDir(): Promise<string> {
  const tempPath = join(tmpdir(), `atlas-test-${randomBytes(8).toString("hex")}`);
  await mkdir(tempPath, { recursive: true });
  return tempPath;
}

export async function cleanupTempDir(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

export async function extractTarball(tarballPath: string, destPath: string): Promise<void> {
  // Simple extraction - in real implementation would use tar library
  const { execSync } = await import("child_process");
  execSync(`tar -xzf "${tarballPath}" -C "${destPath}"`, { encoding: "utf-8" });
}

// Directory tree structure types
interface DirectoryTree {
  [key: string]: DirectoryTree | "file";
}

function shouldIgnore(filePath: string, ignore: string[]): boolean {
  const fileName = filePath.split("/").pop() || "";
  
  for (const pattern of ignore) {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      if (regex.test(fileName)) {
        return true;
      }
    } else if (fileName === pattern) {
      return true;
    }
  }
  return false;
}

export async function getDirectoryTree(
  dirPath: string,
  ignore: string[] = [
    "node_modules",
    ".git",
    ".DS_Store",
    ".env.example",
    ".env",
    ".env.*",
    ".next",
    "dist",
    "build",
    ".turbo",
    "coverage",
    "pnpm-lock.yaml",
    ".tsbuildinfo",
    ".gitkeep",
    ".claude",
    "next-env.d.ts",
  ],
): Promise<DirectoryTree> {
  // Use git to get tracked files instead of filesystem
  const gitOutput = execSync(
    `git ls-tree -r HEAD --name-only`,
    { encoding: "utf-8", cwd: process.cwd() }
  );
  
  const templateRelativePath = "templates/full/";
  const allFiles = gitOutput
    .split("\n")
    .filter(file => file.startsWith(templateRelativePath))
    .map(file => file.substring(templateRelativePath.length))
    .filter(file => file.length > 0)
    .filter(file => !shouldIgnore(file, ignore));

  // Build tree structure from file paths
  const tree: DirectoryTree = {};
  
  for (const filePath of allFiles) {
    const parts = filePath.split("/");
    let current = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;
      
      if (isLastPart) {
        // It's a file
        current[part] = "file";
      } else {
        // It's a directory
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part] as DirectoryTree;
      }
    }
  }
  
  return tree;
}

export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2));
}

export async function readJsonFile<T = unknown>(path: string): Promise<T> {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content);
}
