import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileStorage, toImageMeta } from './storage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const storage = new FileStorage(rootDir);

const port = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);
const host = process.env.BACKEND_HOST || '0.0.0.0';

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/imagext-storage')) {
      await handleStorageApi(request, response, url);
      return;
    }

    await serveStaticAsset(request, response, url);
  } catch (error) {
    console.error('Backend request failed', error);
    sendJson(response, 500, { error: 'Internal server error' });
  }
});

server.listen(port, host, () => {
  console.log(`Imagext backend listening on http://${host}:${port}`);
});

async function handleStorageApi(request, response, url) {
  applyCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  const route = url.pathname.replace('/api/imagext-storage', '') || '/';

  if (request.method === 'GET' && route === '/') {
    sendJson(response, 200, await storage.readSnapshot());
    return;
  }

  if (request.method === 'GET' && route.startsWith('/image-data/')) {
    const imageId = decodeURIComponent(route.slice('/image-data/'.length));
    try {
      sendJson(response, 200, { dataUrl: await storage.readImageData(imageId) });
    } catch (error) {
      sendJson(response, error?.code === 'ENOENT' ? 404 : 500, { error: 'Image data not found' });
    }
    return;
  }

  if (request.method === 'PUT' && route === '/image-data') {
    const body = await readBody(request);
    const payload = body ? JSON.parse(body) : null;
    await storage.persistImageData(Array.isArray(payload) ? payload : []);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'PUT' && route === '/image-data/delete') {
    const body = await readBody(request);
    const payload = body ? JSON.parse(body) : null;
    await storage.deleteImageData(Array.isArray(payload) ? payload : []);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'PUT' && route === '/image-status') {
    const body = await readBody(request);
    const payload = body ? JSON.parse(body) : null;
    const snapshot = await storage.readSnapshot();
    snapshot.images = snapshot.images.map((image) =>
      image.id === payload?.imageId ? { ...image, status: payload.status } : image,
    );
    await storage.writeSnapshot(snapshot);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== 'PUT') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  const body = await readBody(request);
  const payload = body ? JSON.parse(body) : null;
  const snapshot = await storage.readSnapshot();

  if (route === '/projects') {
    snapshot.projects = Array.isArray(payload) ? payload : [];
  } else if (route === '/images') {
    const images = Array.isArray(payload) ? payload : [];
    await storage.persistImageData(images);
    snapshot.images = images.map(toImageMeta);
  } else if (route === '/classification-annotations') {
    snapshot.classificationAnnotations = Array.isArray(payload) ? payload : [];
  } else if (route === '/detection-annotations') {
    snapshot.detectionAnnotations = Array.isArray(payload) ? payload : [];
  } else {
    sendJson(response, 404, { error: 'Unknown storage route' });
    return;
  }

  await storage.writeSnapshot(snapshot);
  sendJson(response, 200, { ok: true });
}

async function serveStaticAsset(request, response, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405;
    response.end('Method not allowed');
    return;
  }

  const decodedPath = decodeURIComponent(url.pathname);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = path.resolve(distDir, `.${requestedPath}`);

  if (!filePath.startsWith(distDir)) {
    response.statusCode = 403;
    response.end('Forbidden');
    return;
  }

  try {
    await sendFile(response, filePath, request.method === 'HEAD');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    await sendFile(response, path.join(distDir, 'index.html'), request.method === 'HEAD');
  }
}

async function sendFile(response, filePath, headOnly) {
  const content = await fs.readFile(filePath);
  response.statusCode = 200;
  response.setHeader('Content-Type', getContentType(filePath));
  response.setHeader('Content-Length', content.length);
  if (headOnly) {
    response.end();
  } else {
    response.end(content);
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk.toString();
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function applyCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
  };
  return contentTypes[extension] || 'application/octet-stream';
}
