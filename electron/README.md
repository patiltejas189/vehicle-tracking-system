# Vehicle Tracking System - Desktop App

A desktop application for the Vehicle Tracking Management System built with Electron.

## 🚀 Features

- **Native Desktop Experience**: Runs as a standalone desktop application
- **System Tray Support**: Minimize to tray for background operation
- **Offline Support**: Works with cached data when offline
- **Auto Updates**: Automatic update checking and installation
- **Cross-Platform**: Windows, macOS, and Linux support
- **Secure**: Isolated renderer process with secure IPC communication

## 🛠️ Development

### Prerequisites

- Node.js 16+ and npm
- Docker and Docker Compose (for backend services)

### Installation

1. **Install dependencies:**
   ```bash
   cd electron
   npm install
   ```

2. **Start development mode:**
   ```bash
   npm run dev
   ```
   This will start both the React dev server and Electron app.

### Building

#### Development Build
```bash
npm run start
```

#### Production Build
```bash
# Build for current platform
npm run build:electron

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux

# Build for all platforms
npm run dist
```

## 📁 Project Structure

```
electron/
├── main.js          # Main Electron process
├── preload.js       # Secure IPC bridge
├── package.json     # Electron dependencies and build config
├── assets/          # Icons and assets
│   ├── icon.png
│   ├── icon.ico
│   └── icon.icns
└── dist/            # Built executables (generated)
```

## 🔧 Configuration

### Build Configuration

The `package.json` contains build configurations for:
- **Windows**: NSIS installer with desktop shortcuts
- **macOS**: DMG installer
- **Linux**: AppImage format

### Environment Variables

- `NODE_ENV=development` - Enables dev tools and hot reload
- `NODE_ENV=production` - Production build optimizations

## 🚀 Usage

### Starting the App

1. **Development:**
   ```bash
   npm run dev
   ```

2. **Production:**
   ```bash
   npm start
   ```

### System Tray

- **Minimize to tray**: Click minimize button or use tray menu
- **Restore**: Click tray icon or use "Show App" menu
- **Quit**: Right-click tray icon → "Quit"

### Keyboard Shortcuts

- `Ctrl+N` / `Cmd+N`: New window
- `Ctrl+Q` / `Cmd+Q`: Quit app
- `Ctrl+Shift+I`: Toggle developer tools
- `F11`: Toggle fullscreen

## 🔒 Security

- **Context Isolation**: Renderer process is isolated from Node.js APIs
- **Preload Scripts**: Secure IPC communication bridge
- **No Node Integration**: Prevents script injection attacks
- **External Link Handling**: External links open in default browser

## 📦 Distribution

### Windows
- **Installer**: `dist/Vehicle Tracking System Setup X.X.X.exe`
- **Portable**: `dist/win-unpacked/`
- **Features**: Desktop shortcut, start menu entry, uninstaller

### macOS
- **DMG**: `dist/Vehicle Tracking System-X.X.X.dmg`
- **Features**: Drag-and-drop installation

### Linux
- **AppImage**: `dist/Vehicle Tracking System-X.X.X.AppImage`
- **Features**: Portable, no installation required

## 🐛 Troubleshooting

### Common Issues

1. **App won't start**
   - Check if backend services are running
   - Verify Node.js version (16+ required)
   - Check console for error messages

2. **Build fails**
   - Ensure all dependencies are installed
   - Check available disk space
   - Try `npm cache clean --force`

3. **Icons not showing**
   - Verify icon files exist in `assets/` folder
   - Check icon formats (PNG for Linux, ICO for Windows, ICNS for macOS)

### Debug Mode

```bash
# Enable verbose logging
DEBUG=electron-builder npm run build:electron
```

## 📋 Requirements

- **Node.js**: 16.0.0 or higher
- **npm**: 7.0.0 or higher
- **Backend Services**: Running via Docker Compose
- **Disk Space**: 500MB for build artifacts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Built with Electron and React**