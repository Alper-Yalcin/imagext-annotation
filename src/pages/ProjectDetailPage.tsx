import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Edit3,
  Focus,
  Image as ImageIcon,
  Loader2,
  Play,
  Tag,
  UploadCloud,
} from "lucide-react";
import { Project } from "../types/project";
import { getProjectById } from "../storage/projectStorage";
import { ImageItem } from "../types/image";
import { addImages, deleteImage, getImagesByProjectId } from "../storage/imageStorage";
import {
  deleteClassificationAnnotationByImageId,
  deleteDetectionAnnotationsByImageId,
  getClassificationAnnotationsByProjectId,
  getDetectionAnnotationsByProjectId,
} from "../storage/annotationStorage";
import { ClassList } from "../components/projects/ClassList";
import { ImageUploader } from "../components/upload/ImageUploader";
import { ImageGrid } from "../components/images/ImageGrid";
import { generateClassificationCsv } from "../utils/csvExport";
import { exportYoloZip } from "../utils/yoloExport";
import { downloadTextFile, sanitizeFileName } from "../utils/download";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TopBar } from "../components/layout/TopBar";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Panel } from "../components/ui/Panel";
import { ProgressBar } from "../components/ui/ProgressBar";

type DetailTab = "overview" | "images" | "settings";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

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

  const classCounts = useMemo(() => {
    if (!project) return {};
    const counts: Record<string, number> = {};
    project.classes.forEach((cls) => {
      counts[cls.id] = 0;
    });

    if (project.type === "classification") {
      getClassificationAnnotationsByProjectId(project.id).forEach((annotation) => {
        counts[annotation.classId] = (counts[annotation.classId] || 0) + 1;
      });
    } else {
      getDetectionAnnotationsByProjectId(project.id).forEach((annotation) => {
        counts[annotation.classId] = (counts[annotation.classId] || 0) + 1;
      });
    }

    return counts;
  }, [project, images]);

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">Project not found</h2>
        <p className="mb-8 text-slate-400">The project you are looking for does not exist or has been deleted.</p>
        <Link to="/projects">
          <Button variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const isClassification = project.type === "classification";
  const totalImages = images.length;
  const labeledImages = images.filter((img) => img.status === "labeled").length;
  const progress = totalImages > 0 ? Math.round((labeledImages / totalImages) * 100) : 0;
  const recentImages = [...images].slice(-6).reverse();

  const handleStartAnnotation = () => {
    navigate(`/projects/${project.id}/annotate`);
  };

  const handleExport = async () => {
    if (!project || images.length === 0) return;

    setLoadingExport(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

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
      setImages(await getImagesByProjectId(project.id));
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
      variant: "danger",
    });

    if (isConfirmed) {
      deleteClassificationAnnotationByImageId(imageId);
      deleteDetectionAnnotationsByImageId(imageId);
      await deleteImage(imageId);
      setImages(await getImagesByProjectId(project.id));
      showToast({ type: "info", title: "Image Deleted", message: "Image and its annotations removed." });
    }
  };

  const tabs = [
    { id: "overview" as const, label: "Genel Bakis" },
    { id: "images" as const, label: "Gorseller", count: totalImages },
    { id: "settings" as const, label: "Ayarlar" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        breadcrumbs={<Breadcrumbs items={[{ label: "Projeler", path: "/projects" }, { label: project.name }]} />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => showToast({ type: "info", title: "Edit", message: "Project edit flow is not available yet." })}
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              Duzenle
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={images.length === 0 || loadingExport}
              isLoading={loadingExport}
              title={images.length === 0 ? "Upload images before exporting." : ""}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1480px] space-y-6 p-8">
          <section className="studio-surface rounded-xl p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950">
                  {isClassification ? <Tag className="h-9 w-9 text-blue-300" /> : <Focus className="h-9 w-9 text-violet-300" />}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <h1 className="truncate text-2xl font-bold tracking-tight text-white">{project.name}</h1>
                    <Badge variant={isClassification ? "classification" : "detection"}>
                      {isClassification ? "Classification" : "YOLO"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {totalImages.toLocaleString()} gorsel - {labeledImages.toLocaleString()} annotation - Created{" "}
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                variant="primary"
                onClick={handleStartAnnotation}
                disabled={images.length === 0}
                title={images.length === 0 ? "Upload at least one image to start annotation." : ""}
                leftIcon={<Play className="h-4 w-4 fill-current" />}
              >
                Annotation'a Basla
              </Button>
            </div>

            <div className="mt-6 flex gap-6 border-b border-slate-700/40">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "border-violet-400 text-white"
                      : "border-transparent text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === "number" && (
                    <span className="ml-2 rounded-full bg-white/7 px-2 py-0.5 text-xs text-slate-400">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {activeTab === "overview" && (
            <>
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
                <Panel title="Ilerleme" className="min-h-[260px]">
                  <div className="grid h-full grid-cols-1 gap-6 p-5 md:grid-cols-[180px_1fr] md:items-center">
                    <div
                      className="mx-auto flex h-36 w-36 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(#7C3AED ${progress * 3.6}deg, rgba(30, 41, 59, 0.9) 0deg)`,
                      }}
                    >
                      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-slate-950 text-center">
                        <span className="text-3xl font-bold text-white">{progress}%</span>
                        <span className="text-xs text-slate-500">Tamamlandi</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <ProgressBar progress={progress} height="md" />
                      <div className="grid grid-cols-3 gap-3">
                        <Metric label="Annotation'lanan" value={labeledImages} />
                        <Metric label="Kalan" value={Math.max(0, totalImages - labeledImages)} />
                        <Metric label="Toplam" value={totalImages} />
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title={`Siniflar (${project.classes.length})`} className="min-h-[260px]">
                  <div className="p-4">
                    <ClassList classes={project.classes} counts={classCounts} />
                  </div>
                </Panel>

                <Panel title="Son Eklenen Gorseller" className="min-h-[260px]">
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {recentImages.length > 0 ? (
                      recentImages.map((image) => (
                        <div key={image.id} className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-slate-950">
                          <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/60 text-center">
                        <ImageIcon className="mb-2 h-8 w-8 text-slate-600" />
                        <p className="text-sm text-slate-500">Henuz gorsel yok</p>
                      </div>
                    )}
                  </div>
                </Panel>
              </section>

              <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
                <ImageUploader projectId={project.id} existingImages={images} onImagesUploaded={handleImagesUploaded} />
                <Panel>
                  <div className="flex h-full min-h-[168px] flex-col justify-between p-5">
                    <div>
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-white">Annotation hazir</h3>
                      <p className="mt-2 text-sm text-slate-500">Dataset yuklendikten sonra etiketleme ekranina gec.</p>
                    </div>
                    <Button variant="primary" onClick={handleStartAnnotation} disabled={images.length === 0} leftIcon={<Play className="h-4 w-4 fill-current" />}>
                      Annotation'a Basla
                    </Button>
                  </div>
                </Panel>
              </section>
            </>
          )}

          {activeTab === "images" && (
            <Panel
              title="Dataset Images"
              headerRight={<Badge variant="neutral">{totalImages} Total</Badge>}
            >
              <div className="p-5">
                <ImageGrid images={images} onDeleteImage={handleDeleteImage} />
              </div>
            </Panel>
          )}

          {activeTab === "settings" && (
            <Panel title="Project Settings">
              <div className="grid gap-6 p-5 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-300">Project type</h3>
                  <Badge variant={isClassification ? "classification" : "detection"}>
                    {isClassification ? "Classification" : "YOLO Detection"}
                  </Badge>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-300">Classes</h3>
                  <ClassList classes={project.classes} counts={classCounts} />
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value.toLocaleString()}</p>
    </div>
  );
}
