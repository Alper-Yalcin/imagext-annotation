export interface ClassificationAnnotation {
  imageId: string;
  projectId: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetectionAnnotation {
  id: string;
  imageId: string;
  projectId: string;
  classId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}
