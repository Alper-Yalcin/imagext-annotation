import { del, get, getMany, keys, set, setMany } from "idb-keyval";
import { ImageItem, ImageMeta, ImageStatus } from "../types/image";

const LEGACY_STORAGE_KEY = "imagext_images";
const MIGRATION_KEY = "imagext_images_v2_migrated";
const PROJECT_IMAGES_PREFIX = "imagext_project_images:";
const IMAGE_DATA_PREFIX = "imagext_image_data:";
const BATCH_SIZE = 250;

// Images are stored in IndexedDB to avoid the 5MB localStorage limit that 
// causes quota exceeded errors for large datasets.

function projectImagesKey(projectId: string): string {
  return `${PROJECT_IMAGES_PREFIX}${projectId}`;
}

function imageDataKey(imageId: string): string {
  return `${IMAGE_DATA_PREFIX}${imageId}`;
}

function toImageMeta(image: ImageItem): ImageMeta {
  const { dataUrl, ...meta } = image;
  return meta;
}

async function setManyInBatches(entries: [IDBValidKey, any][]): Promise<void> {
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    await setMany(entries.slice(i, i + BATCH_SIZE));
  }
}

async function getManyInBatches<T>(imageKeys: IDBValidKey[]): Promise<T[]> {
  const values: T[] = [];
  for (let i = 0; i < imageKeys.length; i += BATCH_SIZE) {
    values.push(...(await getMany<T>(imageKeys.slice(i, i + BATCH_SIZE))));
  }
  return values;
}

async function migrateLegacyImages(): Promise<void> {
  const migrated = await get<boolean>(MIGRATION_KEY);
  if (migrated) return;

  const legacyImages = await get<ImageItem[]>(LEGACY_STORAGE_KEY);
  if (!legacyImages || legacyImages.length === 0) {
    await set(MIGRATION_KEY, true);
    return;
  }

  const projectMap = new Map<string, ImageMeta[]>();
  const dataEntries: [IDBValidKey, string][] = [];

  for (const image of legacyImages) {
    const projectImages = projectMap.get(image.projectId) || [];
    projectImages.push(toImageMeta(image));
    projectMap.set(image.projectId, projectImages);
    dataEntries.push([imageDataKey(image.id), image.dataUrl]);
  }

  await setManyInBatches(dataEntries);
  await setManyInBatches(
    Array.from(projectMap.entries()).map(([projectId, projectImages]) => [projectImagesKey(projectId), projectImages]),
  );
  await set(MIGRATION_KEY, true);
  await del(LEGACY_STORAGE_KEY);
}

export async function getImages(): Promise<ImageItem[]> {
  try {
    await migrateLegacyImages();
    const allKeys = await keys<string>();
    const projectKeys = allKeys.filter((key) => key.startsWith(PROJECT_IMAGES_PREFIX));
    const projectImageGroups = await getManyInBatches<ImageMeta[]>(projectKeys);
    const metas = projectImageGroups.flatMap((group) => group || []);
    return getImagesWithData(metas);
  } catch (e) {
    console.error("Failed to parse images from IndexedDB", e);
    return [];
  }
}

export async function saveImages(images: ImageItem[]): Promise<void> {
  try {
    await migrateLegacyImages();
    const projectMap = new Map<string, ImageMeta[]>();
    const dataEntries: [IDBValidKey, string][] = [];

    for (const image of images) {
      const projectImages = projectMap.get(image.projectId) || [];
      projectImages.push(toImageMeta(image));
      projectMap.set(image.projectId, projectImages);
      dataEntries.push([imageDataKey(image.id), image.dataUrl]);
    }

    await setManyInBatches(dataEntries);
    await setManyInBatches(
      Array.from(projectMap.entries()).map(([projectId, projectImages]) => [projectImagesKey(projectId), projectImages]),
    );
  } catch (e) {
    console.error("Failed to save images to IndexedDB (storage might be full)", e);
    throw new Error("Failed to save image. Storage quota exceeded.");
  }
}

export async function getImageMetasByProjectId(projectId: string): Promise<ImageMeta[]> {
  await migrateLegacyImages();
  return (await get<ImageMeta[]>(projectImagesKey(projectId))) || [];
}

export async function getImageDataUrl(imageId: string): Promise<string | undefined> {
  await migrateLegacyImages();
  return get<string>(imageDataKey(imageId));
}

export async function getImageById(projectId: string, imageId: string): Promise<ImageItem | undefined> {
  const images = await getImageMetasByProjectId(projectId);
  const meta = images.find((img) => img.id === imageId);
  if (!meta) return undefined;

  const dataUrl = await getImageDataUrl(imageId);
  if (!dataUrl) return undefined;

  return { ...meta, dataUrl };
}

export async function getImagesWithData(images: ImageMeta[]): Promise<ImageItem[]> {
  const dataUrls = await getManyInBatches<string>(images.map((image) => imageDataKey(image.id)));
  return images
    .map((image, index) => {
      const dataUrl = dataUrls[index];
      return dataUrl ? { ...image, dataUrl } : undefined;
    })
    .filter((image): image is ImageItem => Boolean(image));
}

export async function getImagesByProjectId(projectId: string): Promise<ImageItem[]> {
  const images = await getImageMetasByProjectId(projectId);
  return getImagesWithData(images);
}

export async function addImages(newImages: ImageItem[]): Promise<void> {
  await migrateLegacyImages();
  const imagesByProject = new Map<string, ImageItem[]>();

  for (const image of newImages) {
    const projectImages = imagesByProject.get(image.projectId) || [];
    projectImages.push(image);
    imagesByProject.set(image.projectId, projectImages);
  }

  for (const [projectId, projectImages] of imagesByProject.entries()) {
    const existingImages = await getImageMetasByProjectId(projectId);
    await set(projectImagesKey(projectId), [...existingImages, ...projectImages.map(toImageMeta)]);
    await setManyInBatches(projectImages.map((image) => [imageDataKey(image.id), image.dataUrl]));
  }
}

export async function deleteImage(imageId: string, projectId?: string): Promise<void> {
  await migrateLegacyImages();
  const targetProjectId = projectId || await findProjectIdByImageId(imageId);
  if (!targetProjectId) return;

  const images = await getImageMetasByProjectId(targetProjectId);
  await set(projectImagesKey(targetProjectId), images.filter(img => img.id !== imageId));
  await del(imageDataKey(imageId));
}

export async function deleteImagesByProjectId(projectId: string): Promise<void> {
  await migrateLegacyImages();
  const images = await getImageMetasByProjectId(projectId);
  await set(projectImagesKey(projectId), []);
  await Promise.all(images.map((image) => del(imageDataKey(image.id))));
}

export async function updateImageStatus(imageId: string, status: ImageStatus, projectId?: string): Promise<void> {
  await migrateLegacyImages();
  const targetProjectId = projectId || await findProjectIdByImageId(imageId);
  if (!targetProjectId) return;

  const images = await getImageMetasByProjectId(targetProjectId);
  const updated = images.map(img =>
    img.id === imageId ? { ...img, status } : img
  );
  await set(projectImagesKey(targetProjectId), updated);
}

async function findProjectIdByImageId(imageId: string): Promise<string | undefined> {
  const allKeys = await keys<string>();
  const projectKeys = allKeys.filter((key) => key.startsWith(PROJECT_IMAGES_PREFIX));

  for (const key of projectKeys) {
    const images = await get<ImageMeta[]>(key);
    if (images?.some((image) => image.id === imageId)) {
      return key.slice(PROJECT_IMAGES_PREFIX.length);
    }
  }

  return undefined;
}
