# 🔧 Troubleshooting

Common issues and their solutions. Check here before creating issues!

## 🚨 Common Issues

### **Installation & Setup**

#### `pnpm install` fails

```bash
# Clear cache and retry
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript errors after installation

```bash
# Rebuild TypeScript references
pnpm type-check
# Or restart your TypeScript server in VSCode
```

#### Port 3000 already in use

```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
# Or use different port
pnpm dev -- --port 3001
```

### **Development Issues**

#### Tailwind classes not working

- ✅ Check `content` paths in `tailwind.config.ts`
- ✅ Restart dev server after config changes
- ✅ Ensure class names are complete (not dynamically constructed)

#### Components not found from `@repo/ui`

```bash
# Rebuild the UI package
pnpm build:ui
# Or run in parallel development
pnpm dev
```

#### TypeScript errors with workspace packages

```bash
# Ensure packages are built
pnpm build

# Check package.json exports
# packages/ui/package.json should have proper exports
```

### **Testing Issues**

#### Tests not finding modules

```bash
# Check test configuration
# Ensure tsconfig paths are correct
# Verify test files follow naming convention
```

#### E2E tests failing

```bash
# Install Playwright browsers
pnpm exec playwright install

# Run tests in headed mode for debugging
pnpm test:e2e -- --headed
```

### **Build & Deployment Issues**

#### Build fails with memory issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

#### CSS not loading in production

- ✅ Check build output for CSS files
- ✅ Verify public folder structure
- ✅ Ensure proper imports in layout.tsx

## 🔍 Debugging Commands

```bash
# Check dependency tree
pnpm list --depth=0

# Verbose build output
pnpm build --verbose

# Debug test configuration
pnpm test -- --reporter=verbose

# Check TypeScript configuration
pnpm tsc --showConfig
```

## 📚 Getting Help

1. **Check documentation** - Relevant guide in `/docs`
2. **Search existing issues** - GitHub repository issues
3. **Create minimal reproduction** - Helps us help you faster
4. **Include system info** - Node version, OS, package manager

---

**Still stuck?** Create an issue with a minimal reproduction! 🆘
