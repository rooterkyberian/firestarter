# CI/CD Quick Reference

## 🚀 Workflow Triggers

| Workflow | Trigger | When |
|----------|---------|------|
| **CI** | `push`, `pull_request` | Every push to any branch |
| **Package** | `push` to `main` or `claude/*` | After CI passes |
| **Release** | `push` tag `v*.*.*` | Manual version tags only |
| **Pre-commit** | `pull_request`, `push` to `main` | PR or main branch |

## 📊 CI Job Matrix

```
ci.yml
├── Build & Test (3 parallel jobs)
│   ├── Node 18.x
│   ├── Node 20.x
│   └── Node 22.x ← uploads artifacts
├── Package Extension (sequential)
│   └── Creates ZIP (only on main/claude/*)
└── Code Quality (parallel)
    ├── Prettier check
    ├── ESLint analysis
    └── Security audit
```

## ✅ Local Pre-flight Checklist

Before pushing, run these commands:

```bash
npm run lint          # Must pass (max 50 warnings)
npm run lint:fix      # Auto-fix issues
npm run format        # Format with Prettier
npm run type-check    # TypeScript validation
npm run build         # Production build test
```

## 🏷️ Creating Releases

```bash
# Update version
npm version patch   # 2.0.0 → 2.0.1
npm version minor   # 2.0.0 → 2.1.0
npm version major   # 2.0.0 → 3.0.0

# Push with tags
git push --follow-tags

# Release workflow will:
# 1. Build extension
# 2. Create ZIP package
# 3. Generate changelog
# 4. Create GitHub release
# 5. Attach artifacts
```

## 📦 Artifacts

| Artifact | Retention | Trigger |
|----------|-----------|---------|
| Build output (`dist/`) | 30 days | Every CI run (Node 22 only) |
| ZIP package | 90 days | Package job |
| Release ZIP | 365 days | Release workflow |

## 🔍 Viewing CI Status

**GitHub UI:**
```
https://github.com/rooterkyberian/firestarter/actions
```

**Branch-specific:**
```
https://github.com/rooterkyberian/firestarter/actions?query=branch:BRANCH_NAME
```

**Via GitHub CLI (if available):**
```bash
gh run list --branch BRANCH_NAME
gh run view RUN_ID
gh run watch
```

## 🐛 Troubleshooting CI Failures

### Build Failure
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Test build
npm run build
```

### Lint Failure
```bash
# See issues
npm run lint

# Auto-fix
npm run lint:fix

# Check specific file
npx eslint src/path/to/file.ts
```

### Type Check Failure
```bash
# Run type check
npm run type-check

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

### Format Check Failure
```bash
# Check formatting
npx prettier --check "src/**/*.{ts,tsx}"

# Auto-format
npm run format
```

## 🔒 Security

**Dependabot:**
- Runs weekly on Mondays
- Groups related dependencies
- Auto-creates PRs

**Security Audit:**
- Runs on every CI build
- Continue-on-error (won't block)
- Review alerts: https://github.com/rooterkyberian/firestarter/security

**Manual audit:**
```bash
npm audit
npm audit fix
```

## 📝 Commit Message Format

Follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `perf:` Performance
- `test:` Testing
- `chore:` Maintenance
- `ci:` CI/CD changes

**Examples:**
```
feat(autoSwipe): add configurable delay
fix(storage): handle null settings properly
docs: update installation instructions
chore(deps): update dependencies
ci: add code coverage reporting
```

## 🎯 CI Performance Tips

1. **Use `npm ci` instead of `npm install`** (deterministic, faster)
2. **Cache dependencies** (done automatically in workflows)
3. **Run jobs in parallel** (matrix strategy for multi-version tests)
4. **Fail fast** (set `fail-fast: true` in matrix if needed)
5. **Use artifacts** instead of rebuilding

## 📊 Current Configuration

- **Max Warnings:** 50 (configurable in package.json)
- **Node Versions:** 18.x, 20.x, 22.x
- **Artifact Upload:** Node 22.x only
- **Package Branches:** `main`, `claude/*`
- **Continue on Error:** Code quality checks

## 🔗 Useful Links

- [Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated:** 2026-01-11
**For detailed documentation, see:** `CI_SETUP.md`
