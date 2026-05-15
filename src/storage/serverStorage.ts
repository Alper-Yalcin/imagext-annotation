import { ClassificationAnnotation, DetectionAnnotation } from "../types/annotation";
import { ImageItem, ImageMeta } from "../types/image";
import { Project } from "../types/project";

export interface StorageSnapshot {
  version: 1;
  updatedAt: string;
  projects: Project[];
  images: ImageMeta[];
  classificationAnnotations: ClassificationAnnotation[];
  detectionAnnotations: DetectionAnnotation[];
}

const API_BASE = "/api/imagext-storage";

let queue = Promise.resolve();

function enqueuePersist(path: string, payload: unknown): void {
  queue = queue
    .then(async () => {
      const response = await fetch(`${API_BASE}/${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Storage API returned ${response.status}`);
      }
    })
    .catch((error) => {
      console.error("Failed to persist data to file storage", error);
    });
}

export async function getServerSnapshot(): Promise<StorageSnapshot | null> {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) return null;
    return (await response.json()) as StorageSnapshot;
  } catch (error) {
    console.error("Failed to load file storage snapshot", error);
    return null;
  }
}

export function persistProjects(projects: Project[]): void {
  enqueuePersist("projects", projects);
}

export function persistImages(images: ImageItem[]): void {
  enqueuePersist("images", images);
}

export function persistImageMetas(images: ImageMeta[]): void {
  enqueuePersist("images", images);
}

export async function getServerImageDataUrl(imageId: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${API_BASE}/image-data/${encodeURIComponent(imageId)}`);
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { dataUrl?: string };
    return payload.dataUrl;
  } catch (error) {
    console.error("Failed to load image data from file storage", error);
    return undefined;
  }
}

export function persistClassificationAnnotations(annotations: ClassificationAnnotation[]): void {
  enqueuePersist("classification-annotations", annotations);
}

export function persistDetectionAnnotations(annotations: DetectionAnnotation[]): void {
  enqueuePersist("detection-annotations", annotations);
}
