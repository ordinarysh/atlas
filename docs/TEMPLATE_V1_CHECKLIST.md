# Atlas Template v1 Production Readiness Checklist

## Overall Progress

```
Phase 1: [░░░░░░░░░░] 0/5 - Critical Blockers
Phase 2: [░░░░░░░░░░] 0/8 - Should Fix
Phase 3: [░░░░░░░░░░] 0/6 - Could Improve
```

---

## 🔴 Phase 1: Critical Blockers (Must Complete for v1)

**Progress:** [░░░░░░░░░░] 0/5

### Error Boundaries & Recovery

- [x] Create `apps/web/src/app/error.tsx` with retry functionality
- [x] Create `apps/web/src/app/not-found.tsx` with proper 404 page
- [x] Create `apps/web/src/app/global-error.tsx` for root-level errors

### Testing Infrastructure

- [ ] Set up Playwright with basic config (`playwright.config.ts`)
- [ ] Add e2e smoke tests (home page, 404, error boundary)

### Domain Architecture

- [ ] Create example domain slice in `domains/todos` OR remove empty `domains/` directory
  - [ ] Schema definitions
  - [ ] API integration
  - [ ] React Query hooks
  - [ ] UI components with all states (loading/error/empty/success)

### Environment Configuration

- [ ] Fix Node version in all `package.json` files to exactly `"22.18.0"` (not `>=`)

---

## 🟡 Phase 2: Should Fix (Important Improvements)

**Progress:** [░░░░░░░░░░] 0/8

### Code Quality & DX

- [ ] Add `eslint-plugin-jsx-a11y` to workspace config
- [ ] Consolidate scripts: keep only `typecheck` (remove `type-check`)
- [ ] Add `ci:local` script to root package.json

### Documentation

- [ ] Create `docs/DECISIONS.md` with architectural choices
- [ ] Document typography scale convention (1.125 ratio) in `docs/frontend/TYPOGRAPHY.md`
- [ ] Add proper component examples showing error states

### Security

- [ ] Add CSP headers configuration to `next.config.ts`
- [ ] Add `pnpm audit` to CI pipeline scripts

### TypeScript Enhancements

- [ ] Add `noImplicitOverride: true` to `tsconfig.base.json`

---

## 🟢 Phase 3: Could Improve (Nice to Have)

**Progress:** [░░░░░░░░░░] 0/6

### Advanced TypeScript

- [ ] Add `exactOptionalPropertyTypes: true` to `tsconfig.base.json`

### Testing Enhancements

- [ ] Configure test coverage thresholds in `vitest.config.ts`
- [ ] Add more comprehensive e2e test scenarios

### Performance & Monitoring

- [ ] Set up bundle analyzer (`@next/bundle-analyzer`)
- [ ] Add request/response interceptors to API client for logging

### Build & Packaging

- [ ] Create `.npmignore` for explicit packaging control

---

## Verification Commands

### Quick Verification (Run after each phase)

```bash
# Check error boundaries
ls -la templates/full/apps/web/src/app/ | grep -E "error|not-found"

# Check Node version consistency
grep -h "\"node\":" templates/full/**/package.json | sort -u

# Check e2e setup
find templates/full -name "*.e2e.ts" -o -name "playwright.config.*"

# Check domain structure
ls -la templates/full/domains/

# Verify TypeScript config
grep "strict\|noUnchecked\|noImplicit" templates/full/tsconfig.base.json
```

### Full Validation

```bash
# Run smoke test
cd templates/full && pnpm smoke

# Type check all packages
cd templates/full && pnpm typecheck

# Run all tests
cd templates/full && pnpm test
```

---

## Sign-off Checklist

### Before v1 Release

- [ ] All Phase 1 items complete
- [ ] Smoke test passes (`pnpm smoke`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] At least 80% of Phase 2 items complete
- [ ] README accurately reflects implementation
- [ ] No critical security warnings from `pnpm audit`

### Ready for Production

- [ ] Error boundaries handle all failure modes gracefully
- [ ] E2E tests cover critical user paths
- [ ] Documentation explains all architectural decisions
- [ ] Template can be cleanly installed and built in isolation

---

## Notes

### Priority Rationale

1. **Phase 1**: Prevents runtime crashes, ensures basic quality gates
2. **Phase 2**: Improves maintainability and security posture
3. **Phase 3**: Optimizes developer experience and performance

### Time Estimates

- Phase 1: 2-3 hours
- Phase 2: 2-3 hours
- Phase 3: 1-2 hours

### Update Progress Bars

Replace `░` with `█` as tasks complete:

- Empty: `[░░░░░░░░░░]`
- Half: `[█████░░░░░]`
- Full: `[██████████]`
