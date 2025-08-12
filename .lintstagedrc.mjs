export default {
  // Authoritative ignore - lint-staged v15+ will respect this
  ignores: ['templates/**'],
  
  // TypeScript files
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'tsc --noEmit --pretty false'
  ],
  
  // JavaScript/MJS/CJS files
  '**/*.{js,jsx,mjs,cjs}': [
    'eslint --fix --max-warnings 0'
  ],

  // JSON files
  '**/*.json': [
    'prettier --write'
  ],

  // YAML files
  '**/*.{yml,yaml}': [
    'prettier --write'
  ],

  // Markdown files
  '**/*.md': [
    'prettier --write'
  ],

  // Schema validation for manifests
  'templates/**/manifest.json': 'pnpm validate --changed || pnpm validate',
  'addons/**/steps.json': 'pnpm validate --changed || pnpm validate', 
  'migrations/**/plan.json': 'pnpm validate --changed || pnpm validate'
}