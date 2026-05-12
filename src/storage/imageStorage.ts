import { get, set } from 'idb-keyval';
import { ImageItem, ImageStatus } from "../types/image";

const STORAGE_KEY = "imagext_images";

// Images are stored in IndexedDB to avoid the 5MB localStorage limit that 
// causes quota exceeded errors for large datasets.

export async function getImages(): Promise<ImageItem[]> {
  try {
    const stored = await get<ImageItem[]>(STORAGE_KEY);
    return stored || [];
  } catch (e) {
    console.error("Failed to parse images from IndexedDB", e);
    return [];
  }
}

export async function saveImages(images: ImageItem[]): Promise<void> {
  try {
    await set(STORAGE_KEY, images);
  } catch (e) {
    console.error("Failed to save images to IndexedDB (storage might be full)", e);
    throw new Error("Failed to save image. Storage quota exceeded.");
  }
}

export async function getImagesByProjectId(projectId: string): Promise<ImageItem[]> {
  const images = await getImages();
  return images.filter(img => img.projectId === projectId);
}

export async function addImages(newImages: ImageItem[]): Promise<void> {
  const images = await getImages();
  await saveImages([...images, ...newImages]);
}

export async function deleteImage(imageId: string): Promise<void> {
  const images = await getImages();
  await saveImages(images.filter(img => img.id !== imageId));
}

export async function deleteImagesByProjectId(projectId: string): Promise<void> {
  const images = await getImages();
  await saveImages(images.filter(img => img.projectId !== projectId));
}

export async function updateImageStatus(imageId: string, status: ImageStatus): Promise<void> {
  const images = await getImages();
  const updated = images.map(img => 
    img.id === imageId ? { ...img, status } : img
  );
  await saveImages(updated);
}
