import fs from 'node:fs/promises';
import path from 'node:path';

export const emptySnapshot = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  projects: [],
  images: [],
  classificationAnnotations: [],
  detectionAnnotations: [],
};

export class FileStorage {
  constructor(rootDir) {
    this.storageDir = path.resolve(rootDir, '.imagext-storage');
    this.storageFile = path.join(this.storageDir, 'store.json');
    this.imageDataDir = path.join(this.storageDir, 'images');
  }

  async readSnapshot() {
    try {
      const content = await fs.readFile(this.storageFile, 'utf8');
      const snapshot = { ...emptySnapshot, ...JSON.parse(content) };
      const imagesWithData = snapshot.images.filter((image) => image?.dataUrl);

      if (imagesWithData.length > 0) {
        await this.persistImageData(imagesWithData);
        snapshot.images = snapshot.images.map(toImageMeta);
        await this.writeSnapshot(snapshot);
      }

      return snapshot;
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.error('Failed to read imagext storage file', error);
      }
      return { ...emptySnapshot };
    }
  }

  async writeSnapshot(snapshot) {
    await fs.mkdir(this.storageDir, { recursive: true });
    await fs.writeFile(
      this.storageFile,
      JSON.stringify({ ...snapshot, updatedAt: new Date().toISOString() }, null, 2),
    );
  }

  imageDataPath(imageId) {
    return path.join(this.imageDataDir, `${sanitizeFileName(imageId)}.txt`);
  }

  async readImageData(imageId) {
    return fs.readFile(this.imageDataPath(imageId), 'utf8');
  }

  async persistImageData(images) {
    await fs.mkdir(this.imageDataDir, { recursive: true });

    await Promise.all(
      images
        .filter((image) => image?.id && image?.dataUrl)
        .map((image) => fs.writeFile(this.imageDataPath(image.id), image.dataUrl, 'utf8')),
    );
  }

  async deleteImageData(imageIds) {
    await Promise.all(
      imageIds
        .filter(Boolean)
        .map((imageId) => fs.unlink(this.imageDataPath(imageId)).catch(() => undefined)),
    );
  }
}

export function toImageMeta(image) {
  const { dataUrl, ...meta } = image;
  return meta;
}

function sanitizeFileName(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '_');
}
