import { ClassificationAnnotation, DetectionAnnotation } from "../types/annotation";
import { persistClassificationAnnotations, persistDetectionAnnotations } from "./serverStorage";

const CLASSIFICATION_STORAGE_KEY = "imagext_classification_annotations";
const DETECTION_STORAGE_KEY = "imagext_detection_annotations";

export function getClassificationAnnotations(): ClassificationAnnotation[] {
  const stored = localStorage.getItem(CLASSIFICATION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as ClassificationAnnotation[];
    } catch (e) {
      console.error("Failed to parse classification annotations from localStorage", e);
    }
  }
  return [];
}

export function saveClassificationAnnotations(annotations: ClassificationAnnotation[]): void {
  try {
    localStorage.setItem(CLASSIFICATION_STORAGE_KEY, JSON.stringify(annotations));
    persistClassificationAnnotations(annotations);
  } catch (e) {
    console.error("Failed to save classification annotations to localStorage", e);
  }
}

export function getClassificationAnnotationByImageId(imageId: string): ClassificationAnnotation | undefined {
  return getClassificationAnnotations().find(a => a.imageId === imageId);
}

export function getClassificationAnnotationsByProjectId(projectId: string): ClassificationAnnotation[] {
  return getClassificationAnnotations().filter(a => a.projectId === projectId);
}

export function upsertClassificationAnnotation(annotation: ClassificationAnnotation): void {
  const annotations = getClassificationAnnotations();
  const index = annotations.findIndex(a => a.imageId === annotation.imageId);
  
  if (index >= 0) {
    annotations[index] = annotation;
  } else {
    annotations.push(annotation);
  }
  
  saveClassificationAnnotations(annotations);
}

export function deleteClassificationAnnotationByImageId(imageId: string): void {
  const annotations = getClassificationAnnotations();
  saveClassificationAnnotations(annotations.filter(a => a.imageId !== imageId));
}

export function deleteClassificationAnnotationsByProjectId(projectId: string): void {
  const annotations = getClassificationAnnotations();
  saveClassificationAnnotations(annotations.filter(a => a.projectId !== projectId));
}

export function deleteClassificationAnnotationsByClassId(projectId: string, classId: string): void {
  const annotations = getClassificationAnnotations();
  saveClassificationAnnotations(annotations.filter(a => !(a.projectId === projectId && a.classId === classId)));
}

export function getDetectionAnnotations(): DetectionAnnotation[] {
  const stored = localStorage.getItem(DETECTION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as DetectionAnnotation[];
    } catch (e) {
      console.error("Failed to parse detection annotations from localStorage", e);
    }
  }
  return [];
}

export function saveDetectionAnnotations(annotations: DetectionAnnotation[]): void {
  try {
    localStorage.setItem(DETECTION_STORAGE_KEY, JSON.stringify(annotations));
    persistDetectionAnnotations(annotations);
  } catch (e) {
    console.error("Failed to save detection annotations to localStorage", e);
  }
}

export function getDetectionAnnotationsByImageId(imageId: string): DetectionAnnotation[] {
  return getDetectionAnnotations().filter(a => a.imageId === imageId);
}

export function getDetectionAnnotationsByProjectId(projectId: string): DetectionAnnotation[] {
  return getDetectionAnnotations().filter(a => a.projectId === projectId);
}

export function replaceDetectionAnnotationsForImage(imageId: string, projectId: string, annotations: DetectionAnnotation[]): void {
  let allAnnotations = getDetectionAnnotations();
  // Remove existing ones for this image
  allAnnotations = allAnnotations.filter(a => a.imageId !== imageId);
  // Add new ones
  allAnnotations.push(...annotations);
  
  saveDetectionAnnotations(allAnnotations);
}

export function deleteDetectionAnnotationById(annotationId: string): void {
  const annotations = getDetectionAnnotations();
  saveDetectionAnnotations(annotations.filter(a => a.id !== annotationId));
}

export function deleteDetectionAnnotationsByImageId(imageId: string): void {
  const annotations = getDetectionAnnotations();
  saveDetectionAnnotations(annotations.filter(a => a.imageId !== imageId));
}

export function deleteDetectionAnnotationsByProjectId(projectId: string): void {
  const annotations = getDetectionAnnotations();
  saveDetectionAnnotations(annotations.filter(a => a.projectId !== projectId));
}

export function deleteDetectionAnnotationsByClassId(projectId: string, classId: string): void {
  const annotations = getDetectionAnnotations();
  saveDetectionAnnotations(annotations.filter(a => !(a.projectId === projectId && a.classId === classId)));
}
