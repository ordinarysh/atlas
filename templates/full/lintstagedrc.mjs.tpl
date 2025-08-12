import micromatch from "micromatch";

// Helper to escape file paths for shell commands
const escapeFileNames = (filenames) => {
  return filenames.map((filename) => `"${filename}"`).join(" ");
};

export default async (stagedFiles) => {
  const commands = [];

  // TypeScript files - lint and format
  const tsFiles = micromatch(stagedFiles, ["**/*.{ts,tsx}"]);
  if (tsFiles.length) {
    // ESLint with --fix and zero warnings tolerance
    commands.push(`eslint ${escapeFileNames(tsFiles)} --fix --max-warnings 0`);

    // Type check all files (not just staged ones for accuracy)
    commands.push("pnpm typecheck");
  }

  // JavaScript/MJS/CJS files - lint and format
  const jsFiles = micromatch(stagedFiles, ["**/*.{js,jsx,mjs,cjs}"]);
  if (jsFiles.length) {
    // ESLint with --fix and zero warnings tolerance
    commands.push(`eslint ${escapeFileNames(jsFiles)} --fix --max-warnings 0`);
  }

  // JSON files - format everything
  const jsonFiles = micromatch(stagedFiles, ["**/*.json"]);
  if (jsonFiles.length) {
    commands.push(`prettier --write ${escapeFileNames(jsonFiles)}`);
  }

  // YAML files - format everything
  const yamlFiles = micromatch(stagedFiles, ["**/*.{yml,yaml}"]);
  if (yamlFiles.length) {
    commands.push(`prettier --write ${escapeFileNames(yamlFiles)}`);
  }

  // Markdown files - format everything
  const mdFiles = micromatch(stagedFiles, ["**/*.md"]);
  if (mdFiles.length) {
    commands.push(`prettier --write ${escapeFileNames(mdFiles)}`);
  }

  // CSS/Style files - format everything
  const styleFiles = micromatch(stagedFiles, ["**/*.{css,scss,sass,less}"]);
  if (styleFiles.length) {
    commands.push(`prettier --write ${escapeFileNames(styleFiles)}`);
  }

  return commands;
};
