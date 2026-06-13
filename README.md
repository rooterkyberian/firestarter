# 🔥 Firestarter - Enhanced Tinder Experience

> Bringing some 🔥 to Tinder through a modern browser extension

A powerful browser extension that enhances your Tinder experience with automation, keyboard shortcuts, and profile insights.

## ⚠️ Disclaimer

- **People are not things, so be kind**
- This tool's purpose is to save everyone time when using the service as intended
- Use responsibly and respectfully
- May violate Tinder's Terms of Service - use at your own risk

## ✨ Features

### 🎯 Auto-Filtering
- **Distance-based filtering**: Automatically skip profiles beyond your preferred distance
- **Height filtering**: Filter profiles based on height preferences
- **Interest blacklist**: Automatically reject profiles with specific interests
- **Bio pattern matching**: Require specific keywords/patterns in bios
- **Smart VIP detection**: Filter out profiles advertising premium services

### ⌨️ Keyboard Shortcuts
- `Insert` - Toggle activation on/off
- `PageDown` - Undo last swipe (Rewind)
- `Numpad 0` - Navigate to next profile image
- `Numpad .` - Reload page

### 📊 Profile Enhancements
- **Auto-expand profiles**: Automatically expands profiles for full information view
- **Social media extraction**: Automatically detects and links Instagram, Snapchat, and Facebook handles
- **Height detection**: Extracts height information from bios
- **Interest analysis**: Shows all detected interests

### 🎨 UI Improvements
- Enhanced profile card display
- Clickable social media links with icons
- Clean, modern settings interface

## 🚀 Installation

1. **Clone and build**
   ```bash
   git clone https://github.com/rooterkyberian/firestarter.git
   cd firestarter
   npm install
   npm run build
   ```

2. **Load in Chrome/Edge**
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 🔧 Configuration

Click the extension icon to open the settings panel where you can configure:

- **Activation**: Enable/disable all features
- **Auto Swipe Left**: Enable automatic rejection based on filters
- **Distance Limit**: Maximum distance in kilometers
- **Height Limit**: Maximum height in centimeters
- **Interests Blacklist**: Comma-separated list of interests to filter
- **Required Bio Pattern**: Regex pattern that bios must match

## 🛠️ Tech Stack

- **TypeScript 5.7** - Type-safe development
- **React 18** - Modern UI framework
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Vite 6** - Lightning-fast build tool
- **Chrome Extension Manifest V3** - Latest extension platform

## 📁 Project Structure

```
firestarter/
├── src/
│   ├── content/          # Content script (runs on Tinder)
│   ├── background/       # Background service worker
│   ├── popup/            # React-based settings UI
│   ├── features/         # Feature modules
│   │   ├── autoSwipe/
│   │   ├── profileAnalyzer/
│   │   ├── socialExtractor/
│   │   └── keyboardShortcuts/
│   └── shared/           # Shared utilities
│       ├── config/       # State management
│       ├── storage/      # Chrome storage wrapper
│       ├── types/        # TypeScript types
│       └── utils/        # Utility functions
└── public/               # Static assets
```

## 📜 Development Scripts

- `npm run dev` - Development build with watch mode
- `npm run build` - Production build (runs `generate-icons` first via `prebuild`)
- `npm run generate-icons` - Regenerate the PNG icons from the inline SVG source
- `npm run test` - Run the unit tests (Vitest)
- `npm run lint` - Lint code with ESLint (zero warnings allowed)
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types
- `npm run package` - Build and package extension as ZIP

> **Icons** are generated at build time from a single SVG in
> `scripts/generate-icons.js` — the PNGs under `public/icons/` are gitignored.

> **Tinder selectors** are inherently fragile. Before relying on a build, walk
> through [`docs/SELECTOR_VERIFICATION.md`](docs/SELECTOR_VERIFICATION.md) against
> the live site.

## ⚙️ CI/CD

GitHub Actions (`.github/workflows/`):

- **ci.yml** — on every push/PR: format check, lint, tests, type-check, build,
  and uploads `dist/` as an artifact. Pushes to `main` also produce a packaged
  zip.
- **release.yml** — on a `v*.*.*` tag: builds, zips, and creates a GitHub Release.

Dependabot keeps npm and Actions dependencies up to date.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run type-check`
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 📧 Support

If you encounter issues:
- Check the browser console for errors
- Open an issue on GitHub
- Ensure you're on the latest version

---

**Made with ❤️ for better Tinder experiences**
