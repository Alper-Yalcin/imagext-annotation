import { Project } from "../types/project";
import { ImageItem } from "../types/image";
import { ClassificationAnnotation } from "../types/annotation";

export function generateClassificationCsv(
  project: Project,
  images: ImageItem[],
  annotations: ClassificationAnnotation[]
): string {
  const header = "image_name,label\n";
  let rows = "";

  const annotationMap = new Map<string, string>();
  for (const ann of annotations) {
    annotationMap.set(ann.imageId, ann.classId);
  }

  const classMap = new Map<string, string>();
  for (const cls of project.classes) {
    classMap.set(cls.id, cls.name);
  }

  for (const image of images) {
    const classId = annotationMap.get(image.id);
    if (!classId) {
      continue; // Skip images without annotations
    }

    let className = classMap.get(classId) || "unknown";
    
    let imageNameEscaped = image.name;
    if (imageNameEscaped.includes(",") || imageNameEscaped.includes("\"")) {
      imageNameEscaped = `"${imageNameEscaped.replace(/"/g, '""')}"`;
    }

    let classNameEscaped = className;
    if (classNameEscaped.includes(",") || classNameEscaped.includes("\"")) {
      classNameEscaped = `"${classNameEscaped.replace(/"/g, '""')}"`;
    }

    rows += `${imageNameEscaped},${classNameEscaped}\n`;
  }

  return header + rows;
}
