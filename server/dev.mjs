import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const backendPort = process.env.BACKEND_PORT || '4000';
const frontendPort = process.env.FRONTEND_PORT || '3000';
const backendUrl = `http://localhost:${backendPort}`;
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const backendAlreadyRunning = await isBackendRunning();
let backend = null;

if (backendAlreadyRunning) {
  console.log(`Using existing Imagext backend on ${backendUrl}`);
} else {
  backend = spawn('node', ['server/index.mjs'], {
    env: { ...process.env, BACKEND_PORT: backendPort },
    stdio: 'inherit',
  });
}

const frontend = spawn('node', [viteBin, '--host', '0.0.0.0', '--port', frontendPort], {
  env: { ...process.env, VITE_BACKEND_URL: backendUrl },
  stdio: 'inherit',
});

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  backend?.kill();
  frontend.kill();
  process.exit(exitCode);
}

backend?.on('exit', (code) => {
  if (!shuttingDown) shutdown(code || 0);
});

frontend.on('exit', (code) => {
  if (!shuttingDown) shutdown(code || 0);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function isBackendRunning() {
  try {
    const response = await fetch(`${backendUrl}/api/imagext-storage`);
    if (!response.ok) return false;
    const snapshot = await response.json();
    return snapshot && typeof snapshot === 'object' && Array.isArray(snapshot.projects);
  } catch {
    return false;
  }
}
