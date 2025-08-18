# GitHub Repository Configuration for Semantic Release

This document outlines the required GitHub repository settings to ensure semantic-release works correctly with our PR workflow.

## Problem Statement

When using GitHub's "Squash and merge" feature, the squash commit message format can break semantic-release if not configured properly. By default, GitHub creates commit messages like:

```
Remove todos functionality and add auth infrastructure (#5)
```

This doesn't follow conventional commit format, causing semantic-release to skip version bumping.

## Required Repository Settings

### 1. Configure Squash Merge Behavior

**Location**: Repository Settings → General → Pull Requests

**Required Setting**:

- ✅ Enable: "Default to PR title for squash merge commits"

**Why**: This ensures squash commits use the PR title as the commit subject, and since we validate PR titles with conventional commits, the squash commit will be properly formatted.

### 2. Pull Request Settings

**Recommended Settings**:

- ✅ Allow squash merging
- ✅ Default to PR title for squash merge commits
- ✅ Delete head branches after merge
- ❌ Allow merge commits (optional, but can complicate history)
- ❌ Allow rebase merging (optional alternative)

## Workflow Integration

### PR Title Validation

We have automated PR title validation via `.github/workflows/pr-title-check.yml` that ensures:

- PR titles follow conventional commit format
- Types match our semantic-release configuration
- Proper format: `<type>[optional scope]: <description>`

### Examples

**Good PR Titles** (will create proper squash commits):

```
feat: add user authentication system
fix: resolve API timeout issues
feat!: restructure database schema
docs: update installation guide
```

**Bad PR Titles** (will fail validation):

```
Add user auth
Fixed bug
Update docs
Infrastructure cleanup (#123)
```

## Semantic Release Configuration

Our `.releaserc.json` is configured to:

- Analyze conventional commits for version bumping
- Generate release notes from commit types
- Handle breaking changes properly
- Support beta releases on develop branch

## Troubleshooting

### If Semantic Release Fails

1. **Check commit format**: Ensure the last commit follows conventional commit format
2. **Review PR title**: Verify the PR title that created the squash commit was conventional
3. **Manual trigger**: Create an empty conventional commit to trigger release:
   ```bash
   git commit --allow-empty -m "chore: trigger semantic release"
   ```

### If GitHub Settings Are Wrong

1. Go to Repository Settings → General → Pull Requests
2. Enable "Default to PR title for squash merge commits"
3. Future merges will use proper commit format
4. For existing problematic commits, create a trigger commit (see above)

## Branch Strategy

- **main**: Production releases (x.y.z)
- **develop**: Beta releases (x.y.z-beta.n)

Semantic-release automatically determines the release channel based on the branch.

## Links

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [GitHub PR Settings Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-pull-requests/about-merge-methods-on-github)
