import micromatch from 'micromatch'

// Helper to escape file paths for shell commands
const escapeFileNames = (filenames) => {
  return filenames.map((filename) => `"${filename}"`).join(' ')
}

export default async (stagedFiles) => {
  const commands = []

  // TypeScript files - exclude templates/** completely
  const tsFiles = micromatch(stagedFiles, ['**/*.{ts,tsx}', '!templates/**', '!fixtures/**'])
  if (tsFiles.length) {
    // ESLint with --fix
    commands.push(`eslint ${escapeFileNames(tsFiles)} --fix`)
    
    // Type check staged files only
    commands.push('tsc --noEmit --pretty false')
  }

  // JavaScript/MJS/CJS files - exclude templates/** completely  
  const jsFiles = micromatch(stagedFiles, ['**/*.{js,jsx,mjs,cjs}', '!templates/**', '!fixtures/**'])
  if (jsFiles.length) {
    // ESLint with --fix
    commands.push(`eslint ${escapeFileNames(jsFiles)} --fix`)
  }

  // JSON files - format everything including templates (JSON should be formatted)
  const jsonFiles = micromatch(stagedFiles, ['**/*.json'])
  if (jsonFiles.length) {
    commands.push(`prettier --write ${escapeFileNames(jsonFiles)}`)
  }

  // YAML files - format everything
  const yamlFiles = micromatch(stagedFiles, ['**/*.{yml,yaml}'])
  if (yamlFiles.length) {
    commands.push(`prettier --write ${escapeFileNames(yamlFiles)}`)
  }

  // Markdown files - format everything
  const mdFiles = micromatch(stagedFiles, ['**/*.md'])
  if (mdFiles.length) {
    commands.push(`prettier --write ${escapeFileNames(mdFiles)}`)
  }

  // Template validation - ONLY validate, no linting/formatting of template source
  const templateManifests = micromatch(stagedFiles, ['templates/**/manifest.json'])
  const addonSteps = micromatch(stagedFiles, ['addons/**/steps.json'])
  const migrationPlans = micromatch(stagedFiles, ['migrations/**/plan.json'])
  
  const schemaFiles = [...templateManifests, ...addonSteps, ...migrationPlans]
  if (schemaFiles.length) {
    // Run incremental validation on changed schema files
    commands.push('pnpm validate --changed || pnpm validate')
  }

  // The forbidden files check is handled in precommit.mjs for better error messages
  // The file size check is also handled in precommit.mjs

  return commands
}