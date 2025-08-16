#!/usr/bin/env tsx
import { join } from "path";
import { writeFile } from "fs/promises";
import { execSync } from "child_process";
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

async function generateSnapshotFromGit(_templatePath: string): Promise<FileNode[]> {
  // Get all tracked files in the template from git
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
    .filter(file => !shouldExclude(file));

  // Build tree structure from file paths
  const tree: Record<string, unknown> = {};
  
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
        current = current[part] as Record<string, unknown>;
      }
    }
  }
  
  // Convert tree to FileNode array
  function treeToNodes(tree: Record<string, unknown>): FileNode[] {
    const nodes: FileNode[] = [];
    
    for (const [name, value] of Object.entries(tree)) {
      if (value === "file") {
        nodes.push({
          type: "file",
          name,
        });
      } else {
        const children = treeToNodes(value as Record<string, unknown>);
        const result: FileNode = {
          type: "directory",
          name,
        };
        if (children.length > 0) {
          result.children = children;
        }
        nodes.push(result);
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
  
  return treeToNodes(tree);
}

async function main() {
  const templatePath = join(process.cwd(), "templates", "full");
  const outputPath = join(process.cwd(), "fixtures", "full-template.json");

  console.log(pc.bold("\n📸 Generating template snapshot\n"));
  console.log(pc.cyan(`Source: ${templatePath}`));
  console.log(pc.cyan(`Output: ${outputPath}\n`));

  try {
    const snapshot = await generateSnapshotFromGit(templatePath);

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
