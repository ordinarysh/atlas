#!/usr/bin/env tsx
import { readdir } from "fs/promises";
import { join } from "path";
import { writeFile } from "fs/promises";
import pc from "picocolors";

// Files and directories to exclude from snapshots
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  ".DS_Store",
  "dist",
  "build",
  ".next",
  ".turbo",
  "coverage",
  "*.log",
  ".env",
  ".env.*",
  ".env.example",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  ".tsbuildinfo",
  ".claude",
  ".gitkeep",
  "next-env.d.ts",
];

interface FileNode {
  type: "file" | "directory";
  name: string;
  children?: FileNode[];
}

function shouldExclude(path: string): boolean {
  const name = path.split("/").pop() || "";

  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.startsWith("!")) continue;

    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      if (regex.test(name)) return true;
    } else if (name === pattern) {
      return true;
    }
  }

  // Check for allowed patterns (starting with !)
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.startsWith("!") && name === pattern.substring(1)) {
      return false;
    }
  }

  return false;
}

async function generateSnapshot(dirPath: string, basePath: string = ""): Promise<FileNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relativePath = basePath ? join(basePath, entry.name) : entry.name;

    if (shouldExclude(relativePath)) continue;

    if (entry.isDirectory()) {
      const children = await generateSnapshot(fullPath, relativePath);
      const result: FileNode = {
        type: "directory",
        name: entry.name,
      };
      if (children.length > 0) {
        result.children = children;
      }
      nodes.push(result);
    } else {
      nodes.push({
        type: "file",
        name: entry.name,
      });
    }
  }

  return nodes.sort((a, b) => {
    // Directories first, then files
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

async function main() {
  const templatePath = join(process.cwd(), "templates", "full");
  const outputPath = join(process.cwd(), "fixtures", "full-template.json");

  console.log(pc.bold("\n📸 Generating template snapshot\n"));
  console.log(pc.cyan(`Source: ${templatePath}`));
  console.log(pc.cyan(`Output: ${outputPath}\n`));

  try {
    const snapshot = await generateSnapshot(templatePath);

    const snapshotData = {
      name: "full-template",
      version: "1.0.0",
      generated: new Date().toISOString(),
      structure: snapshot,
    };

    await writeFile(outputPath, JSON.stringify(snapshotData, null, 2));

    console.log(pc.green("✅ Snapshot generated successfully!"));
    console.log(pc.gray(`Total items: ${countItems(snapshot)}`));
  } catch (error) {
    console.error(pc.red("Failed to generate snapshot:"), error);
    process.exit(1);
  }
}

function countItems(nodes: FileNode[]): number {
  let count = nodes.length;
  for (const node of nodes) {
    if (node.children) {
      count += countItems(node.children);
    }
  }
  return count;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
