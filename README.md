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

### Option 1: From Source (Current - Browser Extension)

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

### Option 2: Legacy UserScript (Old Method)

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Install [firestarter.user.js](https://github.com/rooterkyberian/firestarter/raw/main/build/firestarter.user.js)

**Note**: The userscript version is deprecated. The browser extension offers better performance, security, and features.

## 🔧 Configuration

Click the extension icon to open the settings panel where you can configure:

- **Activation**: Enable/disable all features
- **Auto Swipe Left**: Enable automatic rejection based on filters
- **Distance Limit**: Maximum distance in kilometers
- **Height Limit**: Maximum height in centimeters
- **Interests Blacklist**: Comma-separated list of interests to filter
- **Required Bio Pattern**: Regex pattern that bios must match

## 🛠️ Tech Stack

### Version 2.0 (Browser Extension)
- **TypeScript 5.7** - Type-safe development
- **React 18** - Modern UI framework
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **Vite 6** - Lightning-fast build tool
- **Chrome Extension Manifest V3** - Latest extension platform

### Version 1.0 (UserScript - Deprecated)
- TypeScript 3.9
- Webpack 4
- Tampermonkey/Greasemonkey

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
- `npm run build` - Production build
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types
- `npm run package` - Build and package extension as ZIP

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
