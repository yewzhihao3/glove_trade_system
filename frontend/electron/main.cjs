const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// ─── Read VITE_API_URL from .env file ────────────────────────────────────────
// VITE_ vars are only injected into the browser bundle by Vite — the Electron
// Node.js process never receives them via process.env. We read .env manually.
function loadEnvApiUrl() {
  const envPaths = [
    path.join(__dirname, '../.env'),       // dev: frontend/.env
    path.join(process.resourcesPath || '', '.env'), // packaged build
  ];
  for (const envPath of envPaths) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/^VITE_API_URL\s*=\s*(.+)$/m);
      if (match) return match[1].trim();
    } catch (_) {
      // file not found — try next path
    }
  }
  return 'http://localhost:8000'; // ultimate fallback
}

const API_URL = loadEnvApiUrl();
console.log(`Electron: using API URL → ${API_URL}`);

// Health check is now handled by the React frontend (useBackendHealth hook).
// Electron just needs to load the app window immediately so the React loading
// screen can display while the backend wakes up on Render.


function createErrorWindow(mainWindow) {
  const errorHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Connection Error - Trade Intelligence</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #334155; }
          .container { text-align: center; padding: 2.5rem; background: white; border-radius: 16px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; max-width: 400px; }
          h1 { color: #dc2626; margin-top: 0; margin-bottom: 1rem; font-size: 1.5rem; }
          p { margin: 0.5rem 0; line-height: 1.5; font-size: 0.95rem; }
          .badge { display: inline-block; padding: 0.25rem 0.5rem; background: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 0.85rem; color: #64748b; margin-top: 1rem; border: 1px solid #e2e8f0;}
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Backend Not Reachable</h1>
          <p>Please check your connection or ensure the backend server is running.</p>
          <div class="badge">Attempted API: ${API_URL}</div>
        </div>
      </body>
    </html>
  `;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  try {
    if (isDev) {
      // Vite may bind to 5173 or a fallback port — detect which one is up.
      // wait-on already ensures one of these is ready before Electron starts.
      const devPorts = [5173, 5174, 5175, 5176];
      let devUrl = 'http://localhost:5173';

      for (const port of devPorts) {
        try {
          await new Promise((resolve, reject) => {
            const req = http.get(`http://localhost:${port}`, { timeout: 2000 }, (res) => {
              res.resume();
              resolve(res.statusCode);
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
            req.end();
          });
          devUrl = `http://localhost:${port}`;
          break;
        } catch {
          // port not ready, try next
        }
      }

      console.log(`Loading development server (${devUrl})...`);
      mainWindow.loadURL(devUrl);
    } else {
      console.log('Loading production build...');
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  } catch (error) {
    console.error('Critical error during window creation:', error);
    // React app will show its own error UI
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on('uncaughtException', (error) => {
  console.error("Uncaught Exception in Electron:", error);
});
