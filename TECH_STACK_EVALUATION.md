# Tech Stack Evaluation & Improvement Recommendations

## Current Tech Stack

### Build Tools & Languages
- **TypeScript** v3.9.7 (Released June 2020, ~5 years old)
- **Webpack** v4.44.1 (EOL, current is v5)
- **ts-loader** v8.0.2
- **Node.js** modules (CommonJS)

### Runtime Environment
- **Tampermonkey** UserScript
- **Browser DOM APIs**
- **GM_config** (external CDN dependency from specific commit)

### Dependencies
- `common-tags` for string formatting
- External script: `GM_config` from raw GitHub URL (pinned to specific commit)

---

## Critical Issues

### 1. Outdated TypeScript (v3.9.7 → Latest: 5.7+)
**Impact**: Missing 5+ years of improvements
- No template literal types
- No satisfies operator
- No const type parameters
- Missing modern utility types
- Poor inference compared to modern versions
- Security vulnerabilities in old versions

### 2. Webpack 4 (EOL since 2020)
**Impact**: Build performance, security, modern features
- 2-5x slower builds than Webpack 5
- No persistent caching
- Missing modern JS features support
- Security vulnerabilities
- Larger bundle sizes

### 3. External CDN Dependency (GM_config)
**Impact**: Reliability, security, versioning
- Pinned to specific commit (not a version)
- Raw GitHub content can be unreliable
- No integrity checks (SRI)
- If GitHub goes down or changes URLs, script breaks
- Hard to audit or modify

### 4. No Type Safety for External APIs
```typescript
declare var GM_config: any, GM_notification: any;
```
**Impact**: Runtime errors, poor DX, no autocomplete

### 5. Build Configuration Issues
```javascript
mode: "development",
devtool: "inline-source-map",
```
- Always building in dev mode (larger bundles)
- Source maps in production (security concern)

### 6. No Code Quality Tools
- No linting (ESLint)
- No formatting (Prettier)
- No testing framework
- No CI/CD

### 7. Fragile DOM Selectors
```typescript
document.querySelector("hr:first-of-type + div")
document.querySelectorAll("div.recsPage div")
```
**Impact**: Breaks when Tinder updates their DOM structure

---

## Improvement Recommendations

### Tier 1: Quick Wins (High Impact, Low Effort)

#### 1.1 Update All Dependencies
```json
{
  "devDependencies": {
    "typescript": "^5.7.2",
    "webpack": "^5.96.0",
    "webpack-cli": "^5.1.4",
    "ts-loader": "^9.5.1",
    "common-tags": "^1.8.2"
  }
}
```

**Benefits**:
- Modern TypeScript features
- 2-5x faster builds with Webpack 5 caching
- Better tree-shaking and smaller bundles
- Security patches

#### 1.2 Fix Build Configuration
```javascript
module.exports = (env, argv) => ({
  mode: argv.mode || 'production',
  devtool: argv.mode === 'development' ? 'inline-source-map' : false,
  // ... rest
});
```

**Command**: `webpack --mode production`

#### 1.3 Add TypeScript Types for GM APIs
Create `src/types/greasemonkey.d.ts`:
```typescript
interface GMConfig {
  init(config: {
    id: string;
    title: string;
    fields: Record<string, any>;
    events?: {
      open?: () => void;
      save?: () => void;
    };
  }): void;
  get(key: string, defaultValue?: any): any;
  open(): void;
}

interface GMNotificationOptions {
  text: string;
  title: string;
  timeout?: number;
}

declare const GM_config: GMConfig;
declare function GM_notification(options: GMNotificationOptions): void;
declare function GM_getValue(key: string, defaultValue?: any): any;
declare function GM_setValue(key: string, value: any): void;
```

#### 1.4 Add Code Quality Tools
```json
{
  "devDependencies": {
    "eslint": "^9.17.0",
    "@typescript-eslint/parser": "^8.19.1",
    "@typescript-eslint/eslint-plugin": "^8.19.1",
    "prettier": "^3.4.2"
  },
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

---

### Tier 2: Architectural Improvements (Medium Effort)

#### 2.1 Bundle GM_config Instead of CDN
**Option A**: Install as npm package (if available)
**Option B**: Vendor the file locally

```bash
# Download and vendor
curl -o src/vendor/gm_config.js https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.js
```

Update webpack:
```javascript
// Remove @require from banner
// Import in code instead
import './vendor/gm_config.js';
```

**Benefits**:
- No external runtime dependencies
- Offline development
- Version control
- Can modify/patch if needed

#### 2.2 Modular Architecture
Refactor monolithic `firestarter.ts` into modules:

```
src/
├── config/
│   └── settings.ts          # GM_config setup
├── features/
│   ├── autoSwipe.ts         # Auto-swipe logic
│   ├── profileAnalyzer.ts   # Bio/distance/height parsing
│   ├── socialExtractor.ts   # Social media extraction
│   └── keyboardShortcuts.ts # Keyboard handlers
├── dom/
│   └── selectors.ts         # Centralized selectors
├── utils/
│   ├── dom.ts               # DOM helpers
│   └── events.ts            # Event helpers
└── firestarter.ts           # Main orchestration
```

**Benefits**:
- Easier to test individual features
- Better separation of concerns
- Easier to maintain
- Can enable/disable features

#### 2.3 Robust DOM Selection Strategy
Create a selector manager with fallbacks:

```typescript
// dom/selectors.ts
export const SELECTORS = {
  profileCard: [
    '.profileCard__card',
    '[class*="profileCard"]',
    '.recCard'
  ],
  bioSection: [
    'hr:first-of-type + div',
    '[class*="bio"]',
    'div[data-bio]'
  ]
} as const;

export function findElement(selectors: string[]): Element | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el;
  }
  console.warn('Could not find element with selectors:', selectors);
  return null;
}
```

**Benefits**:
- More resilient to Tinder UI changes
- Easier to update when things break
- Better error reporting

#### 2.4 Add Testing
```json
{
  "devDependencies": {
    "vitest": "^2.1.8",
    "@testing-library/dom": "^10.4.0",
    "jsdom": "^25.0.1"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

Example test:
```typescript
// src/features/__tests__/profileAnalyzer.test.ts
import { describe, it, expect } from 'vitest';
import { bioExtractHeight } from '../profileAnalyzer';

describe('bioExtractHeight', () => {
  it('should extract height in cm', () => {
    expect(bioExtractHeight('I am 175cm tall')).toBe(175);
  });

  it('should extract height in meters', () => {
    expect(bioExtractHeight('I am 1.75 tall')).toBe(175);
  });
});
```

---

### Tier 3: Modern Alternatives (High Effort, Rethinking)

#### 3.1 Move to Vite (instead of Webpack)
**Why**: 10-100x faster dev builds, simpler config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/firestarter.ts',
      userscript: {
        name: 'firestarter',
        namespace: 'firestarter',
        version: '2026.01.11',
        description: 'Improved tinder UI & keyboard shortcuts',
        author: 'RooTer',
        match: ['https://tinder.com/*'],
        grant: ['GM_getValue', 'GM_setValue', 'GM_notification']
      },
    }),
  ],
});
```

**Benefits**:
- Near-instant HMR in development
- Simpler configuration
- Better DX
- Native ESM support
- Built-in optimization

#### 3.2 Use Modern State Management
Instead of global `settings` object:

```typescript
// config/store.ts
import { reactive } from '@vue/reactivity'; // or zustand, or signals

export const settings = reactive({
  activated: true,
  autoSwipeLeft: false,
  distanceLimit: 60,
  heightLimit: 175,
  interestsBlacklist: ['Astrology'],
  requiredRegexp: ''
});

// Auto-sync with GM storage
watch(settings, (newSettings) => {
  GM_setValue('settings', newSettings);
});
```

**Benefits**:
- Reactive updates
- Type-safe
- Easier testing
- Centralized state

#### 3.3 Browser Extension Instead of UserScript
**Why**: Better permissions, native browser integration, store distribution

**Structure**:
```
firestarter-extension/
├── manifest.json (v3)
├── src/
│   ├── content/      # Content scripts (current functionality)
│   ├── background/   # Service worker
│   ├── popup/        # Settings UI (replace GM_config)
│   └── options/      # Options page
└── dist/             # Built extension
```

**Benefits**:
- Better security model
- Native storage API
- Can distribute via Chrome/Firefox stores
- Better debugging tools
- More reliable than UserScript managers
- Can add popup UI

**Considerations**:
- More complex distribution (users need to install extension)
- Store review process
- Manifest V3 limitations

#### 3.4 Framework-Based Settings UI
Replace `GM_config` with modern UI:

**Option A: React + shadcn/ui**
```typescript
// popup/Settings.tsx
import { Switch } from '@/components/ui/switch';

export function Settings() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <label>Auto Swipe Left</label>
        <Switch checked={settings.autoSwipeLeft} />
      </div>
      {/* ... */}
    </div>
  );
}
```

**Option B: Svelte (smaller bundle)**
**Option C: Preact (React-like, smaller)**

**Benefits**:
- Modern, native-looking UI
- Better UX than GM_config
- Easier to extend
- Type-safe

#### 3.5 Use Modern APIs Over XPath
Replace XPath queries with modern DOM APIs:

```typescript
// Before (XPath)
document.evaluate("//a[contains(., 'Back')]", document)
  .iterateNext()

// After (modern)
document.querySelector('a:has-text("Back")') // if available
// or
Array.from(document.querySelectorAll('a'))
  .find(el => el.textContent.includes('Back'))
```

---

## Recommended Migration Path

### Phase 1: Foundation (1-2 days)
1. Update all dependencies to latest versions
2. Fix TypeScript configuration
3. Add proper type definitions for GM APIs
4. Fix webpack config (prod/dev modes)
5. Add ESLint + Prettier

### Phase 2: Quality (2-3 days)
1. Refactor into modular architecture
2. Add centralized selector management
3. Set up testing infrastructure
4. Write tests for core logic (bio parsing, etc.)

### Phase 3: Modernization (3-5 days)
1. Migrate from Webpack to Vite
2. Vendor or replace GM_config
3. Add state management
4. Improve error handling

### Phase 4: Long-term (Optional, 1-2 weeks)
1. Convert to browser extension
2. Build modern settings UI
3. Add telemetry/analytics
4. Create auto-update mechanism

---

## Alternative Approaches

### Approach A: Minimal UserScript (Current ++)
- Keep as UserScript
- Just update dependencies and add types
- Add basic testing
- **Best for**: Personal use, quick updates

### Approach B: Modern UserScript
- Vite + modern tooling
- Modular architecture
- Good testing coverage
- **Best for**: Open source project, maintainability

### Approach C: Browser Extension
- Full extension with popup UI
- Professional distribution
- Enhanced features (background sync, etc.)
- **Best for**: Wide distribution, monetization

### Approach D: Web App/SaaS
- Separate web service that users connect to
- Acts as proxy/API layer
- Web-based dashboard for settings
- **Best for**: Commercial product
- **Note**: Violates Tinder ToS, high legal risk

---

## Security Considerations

### Current Issues
1. No input validation on config values
2. Regex from config used directly (ReDoS risk)
3. innerHTML usage (XSS risk if Tinder serves malicious content)
4. External script from CDN without SRI

### Recommendations
1. Validate all user inputs
2. Sanitize config values
3. Use `textContent` instead of `innerHTML` where possible
4. Add Content Security Policy
5. Bundle all dependencies (no external runtime deps)

---

## Performance Considerations

### Current Issues
1. Debounce timeout of 250ms might be too aggressive
2. Profile expansion on every mutation
3. No memoization of parsed data
4. Regex compilation on every bio parse

### Recommendations
```typescript
// Compile regexes once
const SOCIAL_REGEX = /\b(ig|instagram|...)/gi;

// Memoize expensive operations
const memoizedBioAnalysis = memoize(analyzeBio);

// Use IntersectionObserver instead of MutationObserver
const profileObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      analyzeProfile(entry.target);
    }
  }
});
```

---

## Legal & Ethical Considerations

**Current State**: This tool automates Tinder interactions, which:
- Violates Tinder Terms of Service
- Could lead to account bans
- Raises ethical questions about automation in dating

**Recommendations**:
1. Add prominent disclaimer in README
2. Consider rate limiting to appear more human
3. Make automation opt-in, not default
4. Focus on UI improvements over automation
5. Consider pivoting to pure enhancement features (keyboard shortcuts, better UI) without automation

---

## Cost-Benefit Analysis

### Recommended Immediate Actions (High ROI)
1. **Update TypeScript & Webpack** (2 hours, huge benefits)
2. **Add type definitions** (1 hour, better DX)
3. **Fix build config** (30 min, smaller bundles)
4. **Add ESLint/Prettier** (1 hour, code quality)

**Total**: ~4.5 hours for 80% of the benefits

### Not Worth It (Low ROI)
1. Full browser extension (unless planning distribution)
2. Complex state management (overkill for this size)
3. Heavy frameworks (bundle size concerns)

---

## Conclusion

The current tech stack is functional but severely outdated. The minimum recommended updates are:

1. **TypeScript** 3.9.7 → 5.7.2
2. **Webpack** 4 → 5 (or Vite)
3. **Add proper types** for GM APIs
4. **Modularize** the codebase
5. **Add testing** framework

These changes will provide:
- Better developer experience
- Easier maintenance
- Fewer bugs
- Faster builds
- Modern JavaScript features
- Better IDE support

**Next Steps**: Start with Phase 1 (Foundation) - high impact, low risk, ~1-2 days of work.
