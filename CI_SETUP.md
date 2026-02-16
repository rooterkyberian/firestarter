# CI/CD Setup Documentation

This document describes the GitHub Actions CI/CD setup for the Firestarter browser extension.

## 📋 Overview

The project now has a complete automated CI/CD pipeline with:
- Automated testing and building on every push/PR
- Multi-version Node.js testing
- Code quality checks
- Automated releases
- Dependency management

## 🔄 Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to any branch
- Pull requests to any branch

**Jobs:**

#### Build & Test
- **Matrix Strategy**: Tests on Node.js 18.x, 20.x, and 22.x
- **Steps**:
  1. Checkout code
  2. Setup Node.js with caching
  3. Install dependencies (`npm ci`)
  4. Run linter (`npm run lint`)
  5. Run type checking (`npm run type-check`)
  6. Build extension (`npm run build`)
  7. Upload build artifacts (Node 22.x only)

**Artifacts**: Build output stored for 30 days

#### Package Extension
- **Triggers**: Only on push to `main` or `claude/*` branches
- **Steps**:
  1. Build extension
  2. Create ZIP package
  3. Upload packaged extension

**Artifacts**: ZIP file stored for 90 days

#### Code Quality Checks
- **Steps**:
  1. Check code formatting with Prettier
  2. Run ESLint (continues on error)
  3. Check for security vulnerabilities (continues on error)

### 2. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Push of version tags (e.g., `v2.0.0`, `v2.1.3`)

**Steps**:
1. Checkout code
2. Install dependencies
3. Build extension
4. Create ZIP package with version number
5. Generate changelog from git commits
6. Create GitHub Release with:
   - ZIP attachment
   - Auto-generated release notes
   - Changelog
7. Upload to artifacts (365-day retention)

**Usage:**
```bash
git tag v2.0.1
git push origin v2.0.1
```

This will automatically:
- Build the extension
- Package it as `firestarter-extension-v2.0.1.zip`
- Create a GitHub release
- Attach the ZIP file

## 🤖 Dependabot (`.github/dependabot.yml`)

**Configuration:**
- **Schedule**: Weekly on Mondays
- **Ecosystems**: npm packages and GitHub Actions
- **PR Limit**: 10 open PRs maximum

**Dependency Groups:**
1. **TypeScript**: TypeScript, @typescript-eslint/*, @types/*
2. **React**: React, react-dom, @types/react*
3. **Build Tools**: Vite, Rollup, esbuild
4. **Code Quality**: ESLint, Prettier, @eslint/*

**Benefits:**
- Automatic dependency updates
- Grouped updates to reduce PR noise
- Security patches applied automatically
- Maintains compatibility across related packages

## 📝 Issue & PR Templates

### Issue Templates

#### Bug Report (`.github/ISSUE_TEMPLATE/bug_report.md`)
- Structured bug reporting
- Environment details
- Console error collection
- Reproduction steps

#### Feature Request (`.github/ISSUE_TEMPLATE/feature_request.md`)
- Feature description
- Problem statement
- Proposed solution
- Use cases
- Priority level

#### Issue Config (`.github/ISSUE_TEMPLATE/config.yml`)
- Links to Discussions
- Documentation links
- Security issue reporting

### Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md`)

**Sections:**
- Description
- Type of change (bug fix, feature, etc.)
- Related issues
- Changes made
- Testing checklist
- Code quality checklist

**Benefits:**
- Ensures consistent PR quality
- Reminds contributors to test thoroughly
- Links PRs to related issues
- Maintains documentation

## 📖 Contributing Guide (`.github/CONTRIBUTING.md`)

Comprehensive guide including:
- Code of conduct
- Bug reporting process
- Feature request guidelines
- Development setup instructions
- Code style guidelines
- Commit message conventions
- PR submission process
- Project structure overview
- Testing checklist

## 🔧 ESLint Configuration

### Migration to ESLint 9

**Changes:**
- Migrated from `.eslintrc.json` to `eslint.config.js` (flat config)
- Updated to ESLint 9 format
- Added proper TypeScript and React support

**Configuration Details:**

```javascript
// eslint.config.js
- @eslint/js for base configuration
- @typescript-eslint for TypeScript support
- eslint-plugin-react-hooks for React rules
- Proper DOM globals (HTMLElement, Document, etc.)
- Chrome extension API globals
```

**Ignored Files:**
- Build outputs (`dist/`, `build/`)
- Config files

**Rules:**
- TypeScript `any` type: Warning (not error)
- Unused variables: Warning (allows `_` prefix)
- Console statements: Allowed
- Max warnings: 50 (configurable)

### Lint Scripts

```json
{
  "lint": "eslint src --ext ts,tsx --max-warnings 50",
  "lint:fix": "eslint src --ext ts,tsx --fix"
}
```

## 🚀 Usage Guide

### For Contributors

**Before submitting PR:**
```bash
npm run lint          # Check for linting issues
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code with Prettier
npm run type-check    # Verify TypeScript types
npm run build         # Test production build
```

### For Maintainers

**Creating a release:**
```bash
# Update version in package.json
npm version patch     # or minor, major

# Push with tags
git push --follow-tags

# GitHub Actions will automatically:
# 1. Build the extension
# 2. Create ZIP package
# 3. Create GitHub release
# 4. Attach ZIP file
```

**Monitoring CI:**
- Check Actions tab on GitHub
- Review failed builds immediately
- Monitor Dependabot PRs weekly
- Review security alerts

## 📊 CI Status Badges

Add these to your README.md:

```markdown
[![CI](https://github.com/rooterkyberian/firestarter/actions/workflows/ci.yml/badge.svg)](https://github.com/rooterkyberian/firestarter/actions/workflows/ci.yml)
[![Release](https://github.com/rooterkyberian/firestarter/actions/workflows/release.yml/badge.svg)](https://github.com/rooterkyberian/firestarter/actions/workflows/release.yml)
```

## 🔒 Security

**Automated Security Checks:**
- `npm audit` runs on every CI build
- Dependabot security updates
- Continue-on-error to not block builds

**Best Practices:**
- Review Dependabot security PRs immediately
- Don't ignore security warnings
- Keep dependencies up to date
- Test thoroughly after security updates

## 🎯 Next Steps

**Recommended additions:**
1. **Unit Testing**
   - Add Vitest configuration
   - Write tests for critical features
   - Add test coverage reporting
   - Include test step in CI

2. **E2E Testing**
   - Add Playwright or Puppeteer
   - Test extension in actual browser
   - Automated screenshot testing

3. **Chrome Web Store Publishing**
   - Automate upload to Chrome Web Store
   - Use GitHub Secrets for API keys
   - Automatic submission on release

4. **Firefox Support**
   - Add Firefox-specific manifest
   - Test on Firefox in CI
   - Publish to Firefox Add-ons

5. **Code Coverage**
   - Add Istanbul/NYC
   - Upload to Codecov
   - Display coverage badge

## 📞 Support

For questions about CI/CD setup:
- Check workflow logs in Actions tab
- Review this documentation
- Open an issue with `ci` label

---

**Last Updated**: 2026-01-11
**CI Version**: 1.0
**Maintainer**: RooTer
