# 🖥️ Sonoray ERP Desktop Build & Packaging Guide

This guide describes how to bundle and compile your Sonoray ERP Next.js web application into native desktop applications for **Windows** (`.exe` / `.msi`) and **macOS** (`.dmg` / `.app`) using two standard industry approaches.

---

## Option 1: Tauri (Recommended - Ultra Lightweight)

Tauri uses a Rust-based backend and the native webview of the host operating system, resulting in tiny bundle sizes (~10MB) and extremely fast performance.

### 1. Prerequisites
- **Node.js**: Installed on your system.
- **Rust Compiler**: Install Rust via [rustup.rs](https://rustup.rs/).
- **Windows Build Tools** (For Windows builds): Install C++ build tools via Visual Studio Installer.
- **Xcode** (For macOS builds): Install Xcode from the Mac App Store.

### 2. Initialize Tauri in Frontend
Run the following inside your `frontend` directory:
```bash
npm install @tauri-apps/cli
npx tauri init
```

During initialization, configure the following values:
- **What is your app name?** `Sonoray-ERP`
- **What is the window title?** `Sonoray ERP`
- **Where are your web assets located?** `../out` (points to Next.js static export)
- **What is the url of your dev server?** `http://localhost:3000`
- **What is your frontend build command?** `npm run build`

### 3. Configure Next.js for Static Export
In your `frontend/next.config.ts` or `frontend/next.config.js`, make sure static export is configured so Tauri can read the HTML/JS assets:
```typescript
const nextConfig = {
  output: 'export', // Required for Tauri static asset serving
  images: {
    unoptimized: true // Next.js Image component optimization is not supported in static exports
  }
};
```

### 4. Build the Native Desktop Application
Once configured, run the following commands to compile your app:

#### For Windows:
```bash
npx tauri build
```
*This generates a standalone `.exe` installer and an `.msi` package inside `frontend/src-tauri/target/release/bundle/msi/`.*

#### For macOS:
```bash
npx tauri build
```
*This generates a `.dmg` installer and a `.app` bundle inside `frontend/src-tauri/target/release/bundle/dmg/`.*

---

## Option 2: Electron (The Industry Standard)

Electron wraps your application inside a Chromium browser window and Node.js backend. It supports absolute cross-platform consistency.

### 1. Initialize Electron
In your `frontend` directory, install Electron:
```bash
npm install --save-dev electron electron-builder
```

### 2. Create `main.js` (Electron Entry Point)
Create a new file `frontend/main.js`:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Sonoray ERP",
    icon: path.join(__dirname, 'public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the web app URL directly or a local static build
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'out/index.html')}`;

  win.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

### 3. Add Build Scripts to `package.json`
Add the following scripts and configuration inside your `frontend/package.json`:
```json
{
  "main": "main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"cross-env NODE_ENV=development electron .\"",
    "desktop:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.sonoray.erp",
    "productName": "SonorayERP",
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    }
  }
}
```

### 4. Build Desktop Installers
Run the build script:
```bash
npm run desktop:build
```
*This compiles Next.js and outputs high-quality `.exe` (Windows) and `.dmg` (macOS) desktop installation files in a `dist/` directory!*
