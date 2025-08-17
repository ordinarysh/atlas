# Contributing Workflow with Semantic Release

This document outlines the contribution workflow for the Atlas project, which uses automated semantic versioning and releases.

## Overview

We use **semantic-release** to automatically:

- Determine version numbers based on commit messages
- Generate changelogs
- Create GitHub releases
- Publish packages

This means **your PR title matters** for versioning!

## PR Title Requirements

### Format

Your PR title must follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>
```

### Valid Types

| Type       | Description             | Version Bump  | Example                            |
| ---------- | ----------------------- | ------------- | ---------------------------------- |
| `feat`     | New feature             | Minor (0.1.0) | `feat: add user authentication`    |
| `fix`      | Bug fix                 | Patch (0.0.1) | `fix: resolve API timeout`         |
| `perf`     | Performance improvement | Patch         | `perf: optimize database queries`  |
| `refactor` | Code refactoring        | Patch         | `refactor: simplify auth logic`    |
| `docs`     | Documentation only      | No bump       | `docs: update API guide`           |
| `style`    | Code style/formatting   | No bump       | `style: fix linting issues`        |
| `test`     | Test changes            | No bump       | `test: add integration tests`      |
| `chore`    | Maintenance tasks       | No bump       | `chore: update dependencies`       |
| `ci`       | CI/CD changes           | No bump       | `ci: improve workflow performance` |
| `build`    | Build system changes    | No bump       | `build: optimize webpack config`   |
| `revert`   | Revert previous changes | Patch         | `revert: undo user auth changes`   |

### Breaking Changes

For breaking changes, add `!` after the type:

```
feat!: redesign user API endpoints
fix!: change authentication method

BREAKING CHANGE: The authentication API has been completely redesigned.
Users must update their integration code to use the new endpoints.
```

## Workflow Steps

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# Make your changes
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 2. Create Pull Request

**Important**: Your PR title becomes the squash commit message!

✅ **Good PR Title**:

```
feat: add Redis rate limiting support
```

❌ **Bad PR Title**:

```
Added Redis support (#123)
Update rate limiting
Fix stuff
```

### 3. PR Validation

Our automation will:

- ✅ Validate your PR title format
- ✅ Run tests and linting
- ✅ Provide feedback if title needs fixing

### 4. Merge Process

When maintainers merge your PR:

- GitHub uses your PR title as the squash commit message
- Semantic-release analyzes the commit
- Appropriate version bump is determined
- Release is automatically created

## Individual Commit Guidelines

While PR title is most important, individual commits should also follow conventional format when possible:

```bash
git commit -m "feat: add user registration endpoint"
git commit -m "test: add registration validation tests"
git commit -m "docs: update API documentation"
```

## Scopes (Optional)

You can add scope to provide more context:

```
feat(auth): add OAuth2 support
fix(api): resolve timeout in user endpoints
docs(readme): update installation instructions
```

## Examples

### Feature Addition

```
PR Title: feat: implement email notifications
Description: This PR adds email notification functionality for user actions.

Result: Minor version bump (1.2.0 → 1.3.0)
```

### Bug Fix

```
PR Title: fix: resolve memory leak in auth service
Description: Fixes issue where auth tokens weren't being properly garbage collected.

Result: Patch version bump (1.2.0 → 1.2.1)
```

### Breaking Change

```
PR Title: feat!: migrate to TypeScript 5.0

BREAKING CHANGE: Minimum Node.js version is now 18.0.0
Description: Updates all packages to use TypeScript 5.0 features.

Result: Major version bump (1.2.0 → 2.0.0)
```

### Documentation

```
PR Title: docs: add deployment guide
Description: Adds comprehensive deployment documentation.

Result: No version bump (documentation-only)
```

## Release Channels

- **main branch**: Production releases (1.0.0, 1.1.0, 1.2.0)
- **develop branch**: Beta releases (1.1.0-beta.1, 1.1.0-beta.2)

## Troubleshooting

### PR Title Validation Failed

If you see a PR title validation error:

1. Update your PR title to follow conventional format
2. The automation will re-check automatically
3. Ask for help if you're unsure about the correct type

### Semantic Release Failed

If semantic-release fails after merge:

1. Check the workflow logs in GitHub Actions
2. Verify the commit message follows conventional format
3. Contact maintainers if manual intervention is needed

## Tools and Resources

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits) for commit assistance
- [Commitizen CLI](https://github.com/commitizen/cz-cli) for interactive commit creation

## Questions?

If you're unsure about:

- Which commit type to use
- Whether your change is breaking
- How to structure your PR title

Feel free to ask in the PR comments or reach out to maintainers!
