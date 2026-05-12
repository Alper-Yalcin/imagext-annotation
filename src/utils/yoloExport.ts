import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Project } from "../types/project";
import { ImageItem } from "../types/image";
import { DetectionAnnotation } from "../types/annotation";
import { dataUrlToBlob, sanitizeFileName } from "./download";

export async function exportYoloZip(
  project: Project,
  images: ImageItem[],
  annotations: DetectionAnnotation[]
): Promise<void> {
  const zip = new JSZip();

  const projectNameSanitized = sanitizeFileName(project.name);
  
  // Folders
  const rootFolder = zip.folder(`${projectNameSanitized}-yolo-export`);
  if (!rootFolder) throw new Error("Failed to create root folder in ZIP");

  const imagesFolder = rootFolder.folder("images");
  if (!imagesFolder) throw new Error("Failed to create images folder in ZIP");

  const labelsFolder = rootFolder.folder("labels");
  if (!labelsFolder) throw new Error("Failed to create labels folder in ZIP");

  // Classes file
  const classNames = project.classes.map(c => c.name);
  const classesContent = classNames.join("\n");
  rootFolder.file("classes.txt", classesContent);

  // YAML file
  let yamlContent = `path: .\ntrain: images\nval: images\n\nnames:\n`;
  classNames.forEach((name, idx) => {
    yamlContent += `  ${idx}: ${name}\n`;
  });
  rootFolder.file("dataset.yaml", yamlContent);

  const annotationMap = new Map<string, DetectionAnnotation[]>();
  for (const ann of annotations) {
    if (!annotationMap.has(ann.imageId)) {
      annotationMap.set(ann.imageId, []);
    }
    annotationMap.get(ann.imageId)!.push(ann);
  }

  // Iterate over images
  for (const image of images) {
    const rawImageName = sanitizeFileName(image.name);
    // Determine extension to change to .txt for label
    const lastDotIndex = rawImageName.lastIndexOf(".");
    const baseName = lastDotIndex !== -1 && lastDotIndex > 0 ? rawImageName.substring(0, lastDotIndex) : rawImageName;
    const labelFileName = `${baseName}.txt`;

    // Extract image blob
    const imageBlob = dataUrlToBlob(image.dataUrl);
    imagesFolder.file(rawImageName, imageBlob);

    // Get annotations for this image
    const imageAnns = annotationMap.get(image.id) || [];
    let labelContent = "";

    for (const ann of imageAnns) {
      // Find class index
      const classIndex = project.classes.findIndex(c => c.id === ann.classId);
      if (classIndex === -1) continue;

      let xCenter = (ann.x + ann.width / 2) / image.width;
      let yCenter = (ann.y + ann.height / 2) / image.height;
      let normWidth = ann.width / image.width;
      let normHeight = ann.height / image.height;

      // Clamp values between 0 and 1
      xCenter = Math.max(0, Math.min(1, xCenter));
      yCenter = Math.max(0, Math.min(1, yCenter));
      normWidth = Math.max(0, Math.min(1, normWidth));
      normHeight = Math.max(0, Math.min(1, normHeight));

      // Format to 6 decimal places
      const line = `${classIndex} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${normWidth.toFixed(6)} ${normHeight.toFixed(6)}`;
      labelContent += line + "\n";
    }

    labelsFolder.file(labelFileName, labelContent);
  }

  // Generate ZIP and download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${projectNameSanitized}-yolo-export.zip`);
}
