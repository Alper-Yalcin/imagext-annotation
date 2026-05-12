import { Project } from "../types/project";

export const mockProjects: Project[] = [
  {
    id: "proj_1",
    name: "Cats vs Dogs Classification",
    type: "classification",
    classes: [
      { id: "class_1", name: "cat" },
      { id: "class_2", name: "dog" },
    ],
    totalImages: 1200,
    labeledImages: 450,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "proj_2",
    name: "City Streets Vehicles",
    type: "detection",
    classes: [
      { id: "class_3", name: "car" },
      { id: "class_4", name: "bus" },
      { id: "class_5", name: "truck" },
    ],
    totalImages: 5000,
    labeledImages: 1250,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "proj_3",
    name: "Medical Image Screening",
    type: "classification",
    classes: [
      { id: "class_6", name: "normal" },
      { id: "class_7", name: "anomaly" },
    ],
    totalImages: 250,
    labeledImages: 250,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "proj_4",
    name: "Store Shelf Inventory",
    type: "detection",
    classes: [
      { id: "class_8", name: "product_a" },
      { id: "class_9", name: "product_b" },
    ],
    totalImages: 850,
    labeledImages: 0,
    createdAt: new Date().toISOString(),
  }
];
