import { mkdir, rm, readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

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
  [key: string]: DirectoryTree | 'file';
}

export async function getDirectoryTree(
  dirPath: string,
  ignore: string[] = ["node_modules", ".git", ".DS_Store", ".env.example", ".env", ".env.*", ".next", "dist", "build", ".turbo", "coverage", "pnpm-lock.yaml", ".tsbuildinfo", ".gitkeep", ".claude", "next-env.d.ts"]
): Promise<DirectoryTree> {
  const tree: DirectoryTree = {};
  
  async function scan(currentPath: string, currentTree: DirectoryTree) {
    const entries = await readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Check if should ignore
      let shouldIgnore = false;
      for (const pattern of ignore) {
        if (pattern.includes("*")) {
          const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
          if (regex.test(entry.name)) {
            shouldIgnore = true;
            break;
          }
        } else if (entry.name === pattern) {
          shouldIgnore = true;
          break;
        }
      }
      
      if (shouldIgnore) continue;
      
      const fullPath = join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        const subTree: DirectoryTree = {};
        currentTree[entry.name] = subTree;
        await scan(fullPath, subTree);
      } else {
        currentTree[entry.name] = "file";
      }
    }
  }
  
  await scan(dirPath, tree);
  return tree;
}

export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2));
}

export async function readJsonFile<T = unknown>(path: string): Promise<T> {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content);
}