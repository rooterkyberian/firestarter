# Contributing to Firestarter

Thank you for your interest in contributing to Firestarter! 🔥

## Code of Conduct

- Be respectful and inclusive
- Keep discussions constructive
- Remember: people are not things, so be kind

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/rooterkyberian/firestarter/issues)
2. Use the **Bug Report** template when creating a new issue
3. Include as much detail as possible:
   - Browser and version
   - Extension version
   - Steps to reproduce
   - Console errors
   - Screenshots if applicable

### Suggesting Features

1. Check [existing feature requests](https://github.com/rooterkyberian/firestarter/labels/enhancement)
2. Use the **Feature Request** template
3. Explain the use case and benefits
4. Be open to discussion and alternatives

### Pull Requests

#### Before You Start

1. Fork the repository
2. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

#### Development Setup

1. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/firestarter.git
   cd firestarter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development mode:**
   ```bash
   npm run dev
   ```

4. **Load the extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

#### Making Changes

1. **Write clean code:**
   - Follow the existing code style
   - Use TypeScript types properly
   - Add comments for complex logic
   - Keep functions small and focused

2. **Test your changes:**
   ```bash
   npm run lint          # Check code style
   npm run type-check    # Verify TypeScript types
   npm run build         # Test production build
   ```

3. **Test on actual Tinder:**
   - Load the extension in your browser
   - Test all affected features
   - Check for console errors
   - Verify settings persistence

#### Code Style

- **TypeScript:** Use proper types, avoid `any`
- **Formatting:** Run `npm run format` before committing
- **Naming:**
  - camelCase for variables and functions
  - PascalCase for components and classes
  - UPPER_CASE for constants
- **Files:** One feature per file, organized by domain

#### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Maintenance tasks
- `ci:` CI/CD changes

**Examples:**
```
feat(autoSwipe): add configurable delay between swipes
fix(profileAnalyzer): handle missing bio gracefully
docs: update installation instructions for Firefox
refactor(storage): simplify settings sync logic
```

#### Submitting Your PR

1. **Push your changes:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request:**
   - Use the PR template
   - Link related issues
   - Describe your changes clearly
   - Add screenshots if UI changed

3. **Respond to feedback:**
   - Be open to suggestions
   - Make requested changes promptly
   - Keep the PR focused and small

## Project Structure

```
firestarter/
├── src/
│   ├── content/          # Content script (runs on Tinder)
│   │   └── index.ts
│   ├── background/       # Background service worker
│   │   └── index.ts
│   ├── popup/            # React settings UI
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.css
│   ├── features/         # Feature modules
│   │   ├── autoSwipe/
│   │   ├── profileAnalyzer/
│   │   ├── socialExtractor/
│   │   └── keyboardShortcuts/
│   └── shared/           # Shared code
│       ├── config/       # State management (Zustand)
│       ├── storage/      # Chrome Storage wrapper
│       ├── types/        # TypeScript types
│       └── utils/        # Utility functions
├── public/               # Static assets
│   ├── icons/
│   └── popup.html
└── dist/                 # Build output (git-ignored)
```

## Development Guidelines

### Adding a New Feature

1. **Create feature module:**
   ```typescript
   // src/features/myFeature/index.ts
   export function myFeature() {
     // Feature implementation
   }
   ```

2. **Add types if needed:**
   ```typescript
   // src/shared/types/myFeature.ts
   export interface MyFeatureConfig {
     // ...
   }
   ```

3. **Integrate in content script:**
   ```typescript
   // src/content/index.ts
   import { myFeature } from '@features/myFeature';
   ```

4. **Add settings if needed:**
   ```typescript
   // src/shared/types/settings.ts
   export interface FirestarterSettings {
     // Add your setting
     myFeatureSetting: boolean;
   }
   ```

5. **Update UI:**
   ```tsx
   // src/popup/App.tsx
   // Add UI controls for your feature
   ```

### Working with Chrome APIs

```typescript
// Storage
import { Storage } from '@shared/storage';
const settings = await Storage.getSettings();

// Notifications
chrome.runtime.sendMessage({
  type: 'SHOW_NOTIFICATION',
  payload: { title: 'Title', message: 'Message' }
});
```

### Testing Checklist

Before submitting a PR, ensure:

- [ ] Extension builds without errors
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] All existing features still work
- [ ] New feature works as expected
- [ ] Settings persist correctly
- [ ] No console errors
- [ ] Tested in Chrome/Edge
- [ ] README updated if needed

## Need Help?

- 💬 [Start a Discussion](https://github.com/rooterkyberian/firestarter/discussions)
- 📖 Read the [README](../README.md)
- 🐛 Check [existing issues](https://github.com/rooterkyberian/firestarter/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Firestarter!** 🙏
