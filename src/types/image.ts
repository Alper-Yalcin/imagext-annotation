export type ImageStatus = "unlabeled" | "labeled";

export interface ImageItem {
  id: string;
  projectId: string;
  name: string;
  relativePath?: string;
  dataUrl: string;
  width: number;
  height: number;
  status: ImageStatus;
  createdAt: string;
}
