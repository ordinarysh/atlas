module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Code style changes (formatting, missing semicolons, etc)
        'refactor', // Code refactoring without changing functionality
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Changes to build system or dependencies
        'ci',       // CI/CD configuration changes
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
        'wip',      // Work in progress (allowed on non-protected branches)
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scope - OPTIONAL, not enforced
    'scope-case': [2, 'always', 'lower-case'],
    'scope-enum': [0], // Disabled - allow any scope

    // Subject
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],

    // Header
    'header-max-length': [2, 'always', 72],

    // Body - optional
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [0], // Disabled

    // Footer - optional
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [0], // Disabled
  },
  // Allow WIP commits on non-protected branches
  ignores: [(message) => {
    // Allow merge commits
    if (/^(Merge branch|Merge pull request)/.test(message)) {
      return true;
    }
    
    // Allow WIP commits on non-protected branches
    if (message.startsWith('wip:') || message.startsWith('WIP:')) {
      // Check if we're on a protected branch
      const branch = require('child_process')
        .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' })
        .trim();
      
      return branch !== 'main' && branch !== 'master';
    }
    
    return false;
  }],
  helpUrl: 'https://www.conventionalcommits.org/en/v1.0.0/',
};