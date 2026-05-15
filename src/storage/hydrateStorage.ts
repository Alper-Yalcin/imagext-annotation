import { getClassificationAnnotations, getDetectionAnnotations, saveClassificationAnnotations, saveDetectionAnnotations } from "./annotationStorage";
import { getImages, saveImageMetas, saveImages } from "./imageStorage";
import { getProjects, saveProjects } from "./projectStorage";
import { getServerSnapshot, StorageSnapshot } from "./serverStorage";
import { ClassificationAnnotation, DetectionAnnotation } from "../types/annotation";
import { ImageItem } from "../types/image";
import { ImageMeta } from "../types/image";
import { Project } from "../types/project";

function isEmpty(snapshot: StorageSnapshot): boolean {
  return (
    snapshot.projects.length === 0 &&
    snapshot.images.length === 0 &&
    snapshot.classificationAnnotations.length === 0 &&
    snapshot.detectionAnnotations.length === 0
  );
}

function mergeById<T extends { id: string }>(serverItems: T[], localItems: T[]): T[] {
  const merged = new Map<string, T>();
  serverItems.forEach((item) => merged.set(item.id, item));
  localItems.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

function mergeClassifications(
  serverItems: ClassificationAnnotation[],
  localItems: ClassificationAnnotation[],
): ClassificationAnnotation[] {
  const merged = new Map<string, ClassificationAnnotation>();
  serverItems.forEach((item) => merged.set(item.imageId, item));
  localItems.forEach((item) => merged.set(item.imageId, item));
  return Array.from(merged.values());
}

function mergeDetections(serverItems: DetectionAnnotation[], localItems: DetectionAnnotation[]): DetectionAnnotation[] {
  return mergeById(serverItems, localItems);
}

function toImageMeta(image: ImageItem): ImageMeta {
  const { dataUrl, ...meta } = image;
  return meta;
}

function hasLocalData(projects: Project[], images: ImageItem[], classifications: ClassificationAnnotation[], detections: DetectionAnnotation[]): boolean {
  return projects.length > 0 || images.length > 0 || classifications.length > 0 || detections.length > 0;
}

export async function hydrateStorage(): Promise<void> {
  const [serverSnapshot, localImages] = await Promise.all([getServerSnapshot(), getImages()]);
  if (!serverSnapshot) return;

  const localProjects = getProjects();
  const localClassifications = getClassificationAnnotations();
  const localDetections = getDetectionAnnotations();
  const hasLocalSnapshot = hasLocalData(localProjects, localImages, localClassifications, localDetections);

  if (isEmpty(serverSnapshot)) {
    if (hasLocalSnapshot) {
      saveProjects(localProjects);
      await saveImages(localImages);
      saveClassificationAnnotations(localClassifications);
      saveDetectionAnnotations(localDetections);
    }
    return;
  }

  const projects = mergeById(serverSnapshot.projects, localProjects);
  const images = mergeById(serverSnapshot.images, localImages.map(toImageMeta));
  const classifications = mergeClassifications(serverSnapshot.classificationAnnotations, localClassifications);
  const detections = mergeDetections(serverSnapshot.detectionAnnotations, localDetections);

  saveProjects(projects);
  await saveImageMetas(images);
  saveClassificationAnnotations(classifications);
  saveDetectionAnnotations(detections);
}
