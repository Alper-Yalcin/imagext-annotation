export type ProjectType = "classification" | "detection";

export interface ClassLabel {
  id: string;
  name: string;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  classes: ClassLabel[];
  totalImages: number;
  labeledImages: number;
  createdAt: string;
}
