const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');

const isDev = process.env.NODE_ENV === 'development';
// Use VITE_API_URL if injected, otherwise fallback
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';

function checkBackendHealth() {
  return new Promise((resolve) => {
    const parsedUrl = new URL(API_URL);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    // Add timeout to not hang forever
    const req = client.get(`${API_URL}/health`, { timeout: 3000 }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('Backend health check timed out');
      resolve(false);
    });

    req.on('error', (err) => {
      console.error('Backend health check failed:', err.message);
      resolve(false);
    });
    
    req.end();
  });
}

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
    const isHealthy = await checkBackendHealth();
    
    if (!isHealthy) {
      console.error("Backend health check failed. Loading error screen.");
      createErrorWindow(mainWindow);
      return;
    }

    if (isDev) {
      console.log("Loading development server (http://localhost:5173)...");
      mainWindow.loadURL('http://localhost:5173');
    } else {
      console.log("Loading production build...");
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  } catch (error) {
    console.error("Critical error during window creation:", error);
    createErrorWindow(mainWindow);
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
