import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const storageDir = path.resolve(__dirname, '.imagext-storage');
const storageFile = path.join(storageDir, 'store.json');
const imageDataDir = path.join(storageDir, 'images');

const emptySnapshot = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  projects: [],
  images: [],
  classificationAnnotations: [],
  detectionAnnotations: [],
};

async function readBody(request: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function readSnapshot() {
  try {
    const content = await fs.readFile(storageFile, 'utf8');
    const snapshot = {...emptySnapshot, ...JSON.parse(content)};
    const imagesWithData = snapshot.images.filter((image: any) => image?.dataUrl);

    if (imagesWithData.length > 0) {
      await persistImageData(imagesWithData);
      snapshot.images = snapshot.images.map(toImageMeta);
      await writeSnapshot(snapshot);
    }

    return snapshot;
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error('Failed to read imagext storage file', error);
    }
    return {...emptySnapshot};
  }
}

async function writeSnapshot(snapshot: any) {
  await fs.mkdir(storageDir, {recursive: true});
  await fs.writeFile(storageFile, JSON.stringify({...snapshot, updatedAt: new Date().toISOString()}, null, 2));
}

function imageDataPath(imageId: string) {
  return path.join(imageDataDir, `${imageId.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
}

function toImageMeta(image: any) {
  const {dataUrl, ...meta} = image;
  return meta;
}

async function persistImageData(images: any[]) {
  await fs.mkdir(imageDataDir, {recursive: true});
  const currentImageIds = new Set(images.map((image) => image.id));

  await Promise.all(
    images
      .filter((image) => image?.id && image?.dataUrl)
      .map((image) => fs.writeFile(imageDataPath(image.id), image.dataUrl, 'utf8')),
  );

  const existingFiles = await fs.readdir(imageDataDir).catch(() => []);
  await Promise.all(
    existingFiles
      .filter((fileName) => fileName.endsWith('.txt'))
      .filter((fileName) => !currentImageIds.has(fileName.replace(/\.txt$/, '')))
      .map((fileName) => fs.unlink(path.join(imageDataDir, fileName)).catch(() => undefined)),
  );
}

async function hasPersistedImageData() {
  const existingFiles = await fs.readdir(imageDataDir).catch(() => []);
  return existingFiles.some((fileName) => fileName.endsWith('.txt'));
}

function sendJson(response: any, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function imagextStoragePlugin() {
  return {
    name: 'imagext-storage',
    configureServer(server: any) {
      server.middlewares.use('/api/imagext-storage', async (request: any, response: any) => {
        try {
          const route = request.url?.split('?')[0] || '/';

          if (request.method === 'GET' && route === '/') {
            sendJson(response, 200, await readSnapshot());
            return;
          }

          if (request.method === 'GET' && route.startsWith('/image-data/')) {
            const imageId = decodeURIComponent(route.slice('/image-data/'.length));
            try {
              sendJson(response, 200, {dataUrl: await fs.readFile(imageDataPath(imageId), 'utf8')});
            } catch (error: any) {
              sendJson(response, error?.code === 'ENOENT' ? 404 : 500, {error: 'Image data not found'});
            }
            return;
          }

          if (request.method !== 'PUT') {
            sendJson(response, 405, {error: 'Method not allowed'});
            return;
          }

          const body = await readBody(request);
          const payload = body ? JSON.parse(body) : null;
          const snapshot = await readSnapshot();

          if (route === '/projects') {
            const projects = Array.isArray(payload) ? payload : [];
            if (projects.length > 0 || snapshot.projects.length === 0) {
              snapshot.projects = projects;
            }
          } else if (route === '/images') {
            const images = Array.isArray(payload) ? payload : [];
            const hasImageData = await hasPersistedImageData();
            if (images.length > 0 || (snapshot.images.length === 0 && !hasImageData)) {
              await persistImageData(images);
              snapshot.images = images.map(toImageMeta);
            }
          } else if (route === '/classification-annotations') {
            snapshot.classificationAnnotations = Array.isArray(payload) ? payload : [];
          } else if (route === '/detection-annotations') {
            snapshot.detectionAnnotations = Array.isArray(payload) ? payload : [];
          } else {
            sendJson(response, 404, {error: 'Unknown storage route'});
            return;
          }

          await writeSnapshot(snapshot);
          sendJson(response, 200, {ok: true});
        } catch (error) {
          console.error('Imagext storage API failed', error);
          sendJson(response, 500, {error: 'Storage API failed'});
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [imagextStoragePlugin(), react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/.imagext-storage/**'],
      },
    },
  };
});
