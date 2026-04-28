/**
 * wait-vite.cjs
 * Waits for any of the candidate Vite dev-server ports to become available,
 * then launches Electron. This avoids the "wait-on waits for ALL" issue.
 */
const http = require('http');
const { spawn } = require('child_process');

const PORTS = [5173, 5174, 5175, 5176];
const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 60_000;

function isPortUp(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, { timeout: 1000 }, (res) => {
      res.resume();
      resolve(port);
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function waitForAnyVitePort() {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const results = await Promise.all(PORTS.map(isPortUp));
    const ready = results.find((p) => p !== null);
    if (ready) {
      console.log(`[wait-vite] Vite ready on port ${ready}`);
      return ready;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`[wait-vite] Timed out after ${MAX_WAIT_MS / 1000}s`);
}

waitForAnyVitePort()
  .then(() => {
    console.log('[wait-vite] Launching Electron...');
    const electron = spawn(
      'npm',
      ['run', 'dev:electron'],
      { stdio: 'inherit', shell: true }
    );
    electron.on('exit', (code) => process.exit(code ?? 0));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
