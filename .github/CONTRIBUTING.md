# Contributing to Firestarter

Thanks for your interest in contributing! 🔥

## Code of conduct

Be respectful and constructive. Remember: people are not things, so be kind.

## Getting started

```bash
git clone https://github.com/rooterkyberian/firestarter.git
cd firestarter
npm install
npm run build      # produces dist/ (load unpacked in chrome://extensions)
```

See the [README](../README.md) for the full script list and project layout.

## Reporting bugs / requesting features

Open an issue using the **Bug Report** or **Feature Request** template. For bugs,
include browser + extension version, repro steps, and any console errors.

## Pull requests

1. Branch from `main` (`feature/...` or `fix/...`).
2. Make focused changes; match the existing code style.
3. Before pushing, ensure these pass (CI runs the same):
   ```bash
   npm run format
   npm run lint        # zero warnings allowed
   npm test
   npm run type-check
   npm run build
   ```
4. If you touched Tinder DOM selectors, verify against the live site using
   [`docs/SELECTOR_VERIFICATION.md`](../docs/SELECTOR_VERIFICATION.md).
5. Open the PR using the template and describe what changed and why.

## Commit messages

Use clear, conventional-style messages where practical (e.g. `fix: ...`,
`feat: ...`, `chore: ...`).
