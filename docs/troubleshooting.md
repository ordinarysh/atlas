# Troubleshooting

Common issues when working with the Atlas template system and their solutions.

## Template Development Issues

### Validation Failures

**Symptom**: `pnpm validate` fails with schema errors

```bash
❌ Validation failed. Please fix the issues above.
```

**Solution**:

1. Run `pnpm clean:templates` to remove build artifacts
2. Check template structure matches schema requirements
3. Verify all required files exist (atlas.json, package.json, etc.)

### Build Artifacts in Templates

**Symptom**: Validation fails with node_modules or build output detected

```bash
✗ Found node_modules/ - this should not be committed
✗ Found .next/ directories - Next.js build output should not be committed
```

**Solution**:

```bash
pnpm clean:templates
git status --short  # Verify clean state
```

### Smoke Test Failures

**Symptom**: `pnpm smoke:test` fails during template extraction

```bash
Error: Template extraction failed
```

**Solution**:

1. Ensure template follows proper structure
2. Check for missing dependencies in package.json
3. Verify all paths are relative, not absolute
4. Run `pnpm validate` to check template integrity

## Release Process Issues

### Release Build Failures

**Symptom**: `pnpm build:release` fails with packaging errors

**Solution**:

1. Clean templates first: `pnpm clean:templates`
2. Validate all templates: `pnpm validate`
3. Check exclusion patterns in `scripts/build-release.ts`
4. Ensure no forbidden artifacts exist

### Version Inconsistencies

**Symptom**: Version validation fails across templates

**Solution**:

```bash
pnpm validate:versions
# Fix any version mismatches in package.json files
```

## Git and CI Issues

### Pre-commit Hook Failures

**Symptom**: Commits fail with quality check errors

**Solution**:

1. Run quality checks manually: `pnpm check-all`
2. Fix linting errors: `pnpm lint`
3. Fix type errors: `pnpm typecheck`
4. Clean templates if needed: `pnpm clean:templates`

### CI Pipeline Failures

**Symptom**: GitHub Actions fail on pull requests

**Solution**:

1. Check workflow logs for specific error
2. Ensure Node.js version matches requirements (22.18.0+)
3. Verify pnpm version compatibility (10.14.0+)
4. Run same checks locally: `pnpm check-all`

## Development Environment Issues

### Node.js Version Mismatch

**Symptom**: Build or validation fails with Node.js errors

**Solution**:

```bash
node --version  # Should be 22.18.0+
nvm use         # Use .nvmrc version
```

### pnpm Issues

**Symptom**: Package installation or workspace errors

**Solution**:

```bash
pnpm --version  # Should be 10.14.0+
corepack enable pnpm
pnpm install
```

### TypeScript Errors

**Symptom**: Type checking fails across workspace

**Solution**:

```bash
pnpm typecheck  # Check specific errors
# Fix type issues in affected files
```

## Template Consumption Issues

### Atlas CLI Not Found

**Symptom**: `atlas` command not available

**Solution**:

```bash
npm install -g @ordinarysh/atlas-cli
atlas --version
```

### Template Download Failures

**Symptom**: CLI fails to download templates

**Solution**:

1. Check network connectivity
2. Verify latest CLI version: `npm update -g @ordinarysh/atlas-cli`
3. Check GitHub release artifacts exist
4. Try with specific version: `atlas create myapp --template=full@1.0.0`

## Performance Issues

### Large Template Sizes

**Symptom**: Templates exceed size limits (>25MB)

**Solution**:

1. Run `pnpm clean:templates` before packaging
2. Check for accidentally included binary files
3. Review exclusion patterns in build script
4. Remove unnecessary dependencies

### Slow Build Times

**Symptom**: `pnpm build:release` takes too long

**Solution**:

1. Clean previous builds: `rm -rf release/`
2. Check for large files in templates
3. Optimize exclusion patterns
4. Consider parallelization improvements

## Debugging Commands

### Repository Health Check

```bash
git status --short
pnpm validate
pnpm typecheck
pnpm lint
```

### Template Inspection

```bash
# Check template structure
find templates/full -name "package.json" | head -5

# Verify clean state
find templates/ -name "node_modules" -o -name ".next" -o -name "dist"

# Check file sizes
du -sh templates/full
```

### Build Artifacts

```bash
# Check release artifacts
ls -la release/
cat release/SHA256SUMS

# Verify checksums
shasum -c release/SHA256SUMS
```

## Getting Help

### Information to Include

When reporting issues, include:

1. **System Information**

   ```bash
   node --version
   pnpm --version
   git --version
   ```

2. **Repository State**

   ```bash
   git status --short
   git log --oneline -3
   ```

3. **Error Details**
   - Full error output
   - Steps to reproduce
   - Expected vs actual behavior

### Resources

- **Issues**: [GitHub Issues](https://github.com/ordinarysh/atlas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ordinarysh/atlas/discussions)
- **Atlas CLI**: [CLI Repository](https://github.com/ordinarysh/atlas-cli)

---

_For template-specific issues, refer to the documentation within each template's directory._
