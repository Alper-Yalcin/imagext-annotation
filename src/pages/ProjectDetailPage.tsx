import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Project } from "../types/project";
import { getProjectById } from "../storage/projectStorage";
import { ImageItem } from "../types/image";
import { getImagesByProjectId, addImages, deleteImage } from "../storage/imageStorage";
import { deleteClassificationAnnotationByImageId, deleteDetectionAnnotationsByImageId } from "../storage/annotationStorage";
import { ArrowLeft, Tag, Focus, Play, Download, Loader2 } from "lucide-react";
import { ProjectStats } from "../components/projects/ProjectStats";
import { ClassList } from "../components/projects/ClassList";
import { ImageUploader } from "../components/upload/ImageUploader";
import { ImageGrid } from "../components/images/ImageGrid";
import { generateClassificationCsv } from "../utils/csvExport";
import { exportYoloZip } from "../utils/yoloExport";
import { downloadTextFile, sanitizeFileName } from "../utils/download";
import { getClassificationAnnotationsByProjectId, getDetectionAnnotationsByProjectId } from "../storage/annotationStorage";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TopBar } from "../components/layout/TopBar";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false);
  
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadData() {
      if (projectId) {
        const p = getProjectById(projectId);
        if (p) {
          setProject(p);
          setImages(await getImagesByProjectId(p.id));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
        <p className="text-slate-400 mb-8">The project you are looking for does not exist or has been deleted.</p>
        <Link to="/">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isClassification = project.type === "classification";
  const totalImages = images.length;
  const labeledImages = images.filter(img => img.status === "labeled").length;

  const handleStartAnnotation = () => {
    navigate(`/projects/${project.id}/annotate`);
  };

  const handleExport = async () => {
    if (!project || images.length === 0) return;

    setLoadingExport(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      if (project.type === "classification") {
        const annotations = getClassificationAnnotationsByProjectId(project.id);
        if (annotations.length === 0) {
          showToast({ type: "warning", title: "Cannot Export", message: "No classification annotations found." });
          setLoadingExport(false);
          return;
        }
        const csvContent = generateClassificationCsv(project, images, annotations);
        downloadTextFile(csvContent, `${sanitizeFileName(project.name)}-classification-export.csv`);
        showToast({ type: "success", title: "Export Successful", message: "Classification dataset downloaded." });
      } else {
        const annotations = getDetectionAnnotationsByProjectId(project.id);
        await exportYoloZip(project, images, annotations);
        showToast({ type: "success", title: "Export Successful", message: "YOLO dataset downloaded." });
      }
    } catch (err) {
      console.error("Export failed:", err);
      showToast({ type: "error", title: "Export Failed", message: "Failed to export dataset. Please check console for details." });
    } finally {
      setLoadingExport(false);
    }
  };

  const handleImagesUploaded = async (newImages: ImageItem[]) => {
    try {
      await addImages(newImages);
      setImages(await getImagesByProjectId(project!.id));
      showToast({ type: "success", title: "Upload Complete", message: `${newImages.length} images added to project.` });
    } catch (e: any) {
      showToast({ type: "error", title: "Upload Failed", message: e.message || "Failed to save images" });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const isConfirmed = await confirm({
      title: "Delete Image",
      message: "Are you sure you want to delete this image? Any associated annotations will also be deleted.",
      confirmLabel: "Delete Image",
      variant: "danger"
    });

    if (isConfirmed) {
      deleteClassificationAnnotationByImageId(imageId);
      deleteDetectionAnnotationsByImageId(imageId);
      await deleteImage(imageId);
      setImages(await getImagesByProjectId(project!.id));
      showToast({ type: "info", title: "Image Deleted", message: "Image and its annotations removed." });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05070A]">
      <TopBar 
        breadcrumbs={<Breadcrumbs items={[{ label: "Projects", path: "/" }, { label: project.name, path: `/projects/${project.id}` }, { label: "Overview" }]} />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={images.length === 0 || loadingExport}
              isLoading={loadingExport}
              title={images.length === 0 ? "Upload images before exporting." : ""}
              leftIcon={<Download className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">
                {loadingExport ? "Exporting..." : "Export Dataset"}
              </span>
            </Button>
            <Button
              variant="primary"
              onClick={handleStartAnnotation}
              disabled={images.length === 0}
              title={images.length === 0 ? "Upload at least one image to start annotation." : ""}
              leftIcon={<Play className="w-4 h-4 fill-current" />}
            >
              Start Annotation
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-3">{project.name}</h1>
            <div className="flex items-center gap-3">
              <Badge variant={isClassification ? "classification" : "detection"} className="flex gap-1.5 px-2.5 py-1 text-sm font-medium">
                {isClassification ? <Tag className="w-4 h-4" /> : <Focus className="w-4 h-4" />}
                {isClassification ? 'Classification' : 'YOLO Detection'}
              </Badge>
              <span className="text-slate-500 text-sm">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Stats Segment */}
          <div className="mb-8">
            <ProjectStats 
              totalImages={totalImages} 
              labeledImages={labeledImages} 
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Classes */}
            <div className="xl:col-span-1 space-y-8">
              <div className="bg-[#0B0F14] border border-white/5 rounded-2xl p-5 shadow-lg">
                <ClassList classes={project.classes} />
              </div>
            </div>

            {/* Right Column - Images/Canvas */}
            <div className="xl:col-span-3 space-y-6">
              <ImageUploader 
                projectId={project.id} 
                existingImages={images}
                onImagesUploaded={handleImagesUploaded} 
              />
              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white tracking-tight">Dataset Images</h3>
                  <Badge variant="default" className="text-sm px-3">{totalImages} Total</Badge>
                </div>
                <ImageGrid 
                  images={images} 
                  onDeleteImage={handleDeleteImage} 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
