import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Keyboard,
  Loader2,
  Save,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Project } from "../../types/project";
import { ImageItem, ImageMeta } from "../../types/image";
import { ImageSidebar } from "./ImageSidebar";
import { ClassPanel } from "./ClassPanel";
import {
  deleteClassificationAnnotationByImageId,
  deleteClassificationAnnotationsByClassId,
  deleteDetectionAnnotationsByImageId,
  getClassificationAnnotationByImageId,
  getClassificationAnnotationsByProjectId,
  upsertClassificationAnnotation,
} from "../../storage/annotationStorage";
import { deleteImage, getImageById, updateImageStatus } from "../../storage/imageStorage";
import { updateProject } from "../../storage/projectStorage";
import { createId } from "../../utils/id";
import { getClassColor } from "../../utils/classColor";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { Modal } from "../ui/Modal";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { Button } from "../ui/Button";

interface ClassificationAnnotatorProps {
  project: Project;
  initialImages: ImageMeta[];
}

const IMAGE_VIEW_PADDING = 48;

export function ClassificationAnnotator({ project, initialImages }: ClassificationAnnotatorProps) {
  const navigate = useNavigate();
  const [activeProject, setActiveProject] = useState<Project>(project);
  const [images, setImages] = useState<ImageMeta[]>(initialImages);
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [savedClassId, setSavedClassId] = useState<string | undefined>();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageViewportSize, setImageViewportSize] = useState({ width: 0, height: 0 });
  const imageViewportRef = useRef<HTMLDivElement>(null);

  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const currentImageMeta = images[currentIndex];
  const isDirty = selectedClassId !== savedClassId;
  const selectedClass = activeProject.classes.find((cls) => cls.id === selectedClassId);
  const [imageClassIdsByImageId, setImageClassIdsByImageId] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    getClassificationAnnotationsByProjectId(project.id).forEach((annotation) => {
      map[annotation.imageId] = [annotation.classId];
    });
    return map;
  });

  useEffect(() => {
    let isCancelled = false;

    setCurrentImage(null);
    if (!currentImageMeta) return;

    getImageById(activeProject.id, currentImageMeta.id).then((image) => {
      if (!isCancelled) setCurrentImage(image || null);
    });

    return () => {
      isCancelled = true;
    };
  }, [activeProject.id, currentImageMeta]);

  useEffect(() => {
    if (currentImageMeta) {
      const annotation = getClassificationAnnotationByImageId(currentImageMeta.id);
      setSelectedClassId(annotation?.classId);
      setSavedClassId(annotation?.classId);
      setImageZoom(1);
    }
  }, [currentIndex, currentImageMeta]);

  useEffect(() => {
    const element = imageViewportRef.current;
    if (!element) return;

    const updateViewportSize = () => {
      setImageViewportSize({ width: element.clientWidth, height: element.clientHeight });
    };
    updateViewportSize();

    const resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  const requestImageChange = async (newIndex: number) => {
    if (isDirty) {
      const isConfirmed = await confirm({
        title: "Unsaved Changes",
        message: "You have unsaved changes. Do you want to continue without saving?",
        confirmLabel: "Discard Changes",
        variant: "danger",
      });
      if (!isConfirmed) return;
    }
    setCurrentIndex(newIndex);
  };

  const handleSelectImage = (imageId: string) => {
    const idx = images.findIndex((img) => img.id === imageId);
    if (idx !== -1 && idx !== currentIndex) requestImageChange(idx);
  };

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) requestImageChange(currentIndex - 1);
  }, [currentIndex, isDirty]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) requestImageChange(currentIndex + 1);
  }, [currentIndex, images.length, isDirty]);

  const handleSave = useCallback(() => {
    if (!currentImage) return;
    if (!selectedClassId) {
      showToast({ type: "warning", title: "No Class Selected", message: "Please select a class before saving." });
      return;
    }
    if (!isDirty) return;

    setIsSaving(true);
    setTimeout(async () => {
      try {
        upsertClassificationAnnotation({
          imageId: currentImage.id,
          projectId: activeProject.id,
          classId: selectedClassId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await updateImageStatus(currentImage.id, "labeled", activeProject.id);
        setSavedClassId(selectedClassId);
        setImages((prev) => prev.map((img) => (img.id === currentImage.id ? { ...img, status: "labeled" } : img)));
        setImageClassIdsByImageId((prev) => ({ ...prev, [currentImage.id]: [selectedClassId] }));
        showToast({ type: "success", title: "Saved", message: "Annotation saved successfully.", duration: 2000 });
      } catch {
        showToast({ type: "error", title: "Error", message: "Failed to save annotation." });
      } finally {
        setIsSaving(false);
        if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
      }
    }, 100);
  }, [selectedClassId, isDirty, currentImage, activeProject.id, currentIndex, images.length, showToast]);

  const handleBackToProject = async () => {
    if (isDirty) {
      const isConfirmed = await confirm({
        title: "Unsaved Changes",
        message: "You have unsaved changes. Return to project without saving?",
        confirmLabel: "Discard Changes",
        variant: "danger",
      });
      if (!isConfirmed) return;
    }
    navigate(`/projects/${activeProject.id}`);
  };

  const handleAddClass = (className: string) => {
    const trimmedName = className.trim();
    if (!trimmedName) return false;

    if (activeProject.classes.some(cls => cls.name.toLowerCase() === trimmedName.toLowerCase())) {
      showToast({ type: "warning", title: "Class exists", message: `"${trimmedName}" is already in this project.` });
      return false;
    }

    const newClass = {
      id: createId("class"),
      name: trimmedName,
      color: getClassColor(trimmedName, activeProject.classes.length),
    };
    const updatedProject = { ...activeProject, classes: [...activeProject.classes, newClass] };

    updateProject(updatedProject);
    setActiveProject(updatedProject);
    setSelectedClassId(newClass.id);
    showToast({ type: "success", title: "Class added", message: `"${trimmedName}" is ready to use.` });
    return true;
  };

  const handleDeleteClass = async (classId: string) => {
    const targetClass = activeProject.classes.find(cls => cls.id === classId);
    if (!targetClass) return;

    const affectedImageIds = new Set(
      getClassificationAnnotationsByProjectId(activeProject.id)
        .filter(annotation => annotation.classId === classId)
        .map(annotation => annotation.imageId),
    );

    const confirmed = await confirm({
      title: "Delete Class",
      message: `Delete "${targetClass.name}"? Existing image labels using this class will also be removed.`,
      confirmLabel: "Delete Class",
      variant: "danger",
    });
    if (!confirmed) return;

    const updatedProject = {
      ...activeProject,
      classes: activeProject.classes.filter(cls => cls.id !== classId),
    };

    deleteClassificationAnnotationsByClassId(activeProject.id, classId);
    updateProject(updatedProject);
    await Promise.all(Array.from(affectedImageIds).map(imageId => updateImageStatus(imageId, "unlabeled", activeProject.id)));

    setActiveProject(updatedProject);
    setImages(prev => prev.map(img => affectedImageIds.has(img.id) ? { ...img, status: "unlabeled" } : img));
    setImageClassIdsByImageId((prev) => {
      const next = { ...prev };
      affectedImageIds.forEach((imageId) => {
        delete next[imageId];
      });
      return next;
    });
    if (selectedClassId === classId) setSelectedClassId(undefined);
    if (savedClassId === classId) setSavedClassId(undefined);

    showToast({
      type: "info",
      title: "Class deleted",
      message: affectedImageIds.size > 0
        ? `"${targetClass.name}" and ${affectedImageIds.size} labels were removed.`
        : `"${targetClass.name}" was removed.`,
    });
  };

  const handleDeleteImage = async (imageId: string) => {
    const targetImage = images.find((image) => image.id === imageId);
    if (!targetImage) return;

    const confirmed = await confirm({
      title: "Delete Image",
      message: `"${targetImage.name}" silinsin mi? Bu gorsele ait annotation'lar da silinecek.`,
      confirmLabel: "Delete Image",
      variant: "danger",
    });
    if (!confirmed) return;

    deleteClassificationAnnotationByImageId(imageId);
    deleteDetectionAnnotationsByImageId(imageId);
    await deleteImage(imageId, activeProject.id);

    const deletedIndex = images.findIndex((image) => image.id === imageId);
    const nextImages = images.filter((image) => image.id !== imageId);

    setImages(nextImages);
    setImageClassIdsByImageId((prev) => {
      const next = { ...prev };
      delete next[imageId];
      return next;
    });

    if (currentImage?.id === imageId) {
      setCurrentImage(null);
      setSelectedClassId(undefined);
      setSavedClassId(undefined);
    }

    if (nextImages.length === 0) {
      showToast({ type: "info", title: "Image Deleted", message: "Son gorsel silindi. Proje sayfasina donuluyor." });
      navigate(`/projects/${activeProject.id}`);
      return;
    }

    let nextIndex = currentIndex;
    if (deletedIndex < currentIndex) nextIndex = currentIndex - 1;
    if (nextIndex >= nextImages.length) nextIndex = nextImages.length - 1;
    setCurrentIndex(nextIndex);

    showToast({ type: "info", title: "Image Deleted", message: "Gorsel ve annotation'lari silindi." });
  };

  const updateImageZoom = useCallback((getNextZoom: (currentZoom: number) => number) => {
    const viewport = imageViewportRef.current;
    const centerX = viewport && viewport.scrollWidth > 0
      ? (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth
      : 0.5;
    const centerY = viewport && viewport.scrollHeight > 0
      ? (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight
      : 0.5;

    setImageZoom((currentZoom) => {
      const nextZoom = Math.max(1, Math.min(6, getNextZoom(currentZoom)));

      window.requestAnimationFrame(() => {
        const nextViewport = imageViewportRef.current;
        if (!nextViewport) return;

        nextViewport.scrollLeft = nextViewport.scrollWidth * centerX - nextViewport.clientWidth / 2;
        nextViewport.scrollTop = nextViewport.scrollHeight * centerY - nextViewport.clientHeight / 2;
      });

      return nextZoom;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    updateImageZoom((value) => value * 1.2);
  }, [updateImageZoom]);

  const handleZoomOut = useCallback(() => {
    updateImageZoom((value) => value / 1.2);
  }, [updateImageZoom]);

  const handleFitImage = useCallback(() => {
    setImageZoom(1);
    window.requestAnimationFrame(() => {
      const viewport = imageViewportRef.current;
      if (!viewport) return;
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    });
  }, []);

  const shortcutMap = useMemo(() => {
    const map: Record<string, (event: KeyboardEvent) => void> = {
      A: handlePrev,
      D: handleNext,
      S: handleSave,
      Z: handleZoomIn,
      X: handleZoomOut,
      F: handleFitImage,
      Escape: () => setSelectedClassId(undefined),
      "?": () => setShowShortcuts(true),
    };

    activeProject.classes.forEach((cls, idx) => {
      if (idx < 9) map[(idx + 1).toString()] = () => setSelectedClassId(cls.id);
    });

    return map;
  }, [handlePrev, handleNext, handleSave, handleZoomIn, handleZoomOut, handleFitImage, activeProject.classes]);

  useKeyboardShortcuts(shortcutMap, !showShortcuts);

  if (!currentImageMeta) return null;

  const fitImageScale = currentImage && imageViewportSize.width > 0 && imageViewportSize.height > 0
    ? Math.min(
        1,
        Math.max(
          0.05,
          Math.min(
            (imageViewportSize.width - IMAGE_VIEW_PADDING) / currentImage.width,
            (imageViewportSize.height - IMAGE_VIEW_PADDING) / currentImage.height,
          ),
        ),
      )
    : 1;
  const displayedImageWidth = currentImage ? currentImage.width * fitImageScale * imageZoom : 0;
  const displayedImageHeight = currentImage ? currentImage.height * fitImageScale * imageZoom : 0;
  const imageStageWidth = Math.max(imageViewportSize.width, displayedImageWidth + IMAGE_VIEW_PADDING);
  const imageStageHeight = Math.max(imageViewportSize.height, displayedImageHeight + IMAGE_VIEW_PADDING);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-app-bg text-slate-100">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/40 bg-slate-950/70 px-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={handleBackToProject}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {activeProject.name}
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white">
          <button type="button" onClick={handlePrev} disabled={currentIndex === 0} className="text-slate-400 hover:text-white disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>{currentIndex + 1} / {images.length}</span>
          <button type="button" onClick={handleNext} disabled={currentIndex === images.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </button>
          <Button
            onClick={handleSave}
            disabled={!selectedClassId || !isDirty || isSaving}
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Kaydet & Sonraki
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ImageSidebar
          images={images}
          currentImageId={currentImageMeta.id}
          classes={activeProject.classes}
          imageClassIdsByImageId={imageClassIdsByImageId}
          onSelectImage={handleSelectImage}
          onDeleteImage={handleDeleteImage}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-slate-950/35 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">{currentImageMeta.name}</h2>
              <p className="text-xs text-slate-500">
                {currentImageMeta.width}x{currentImageMeta.height}px - classification
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Kaydedilmemis degisiklikler
                </div>
              )}
              {!isDirty && savedClassId && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Kaydedildi
                </div>
              )}
            </div>
          </div>

          <div ref={imageViewportRef} className="relative min-h-0 flex-1 overflow-auto rounded-xl border border-slate-700/50 bg-slate-950">
            <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.18)_1px,transparent_1px)] [background-size:32px_32px]" />
            {currentImage ? (
              <div
                className="relative flex min-h-full min-w-full items-center justify-center p-6"
                style={{ width: imageStageWidth, height: imageStageHeight }}
              >
                <img
                  key={currentImage.id}
                  src={currentImage.dataUrl}
                  alt={currentImage.name}
                  className="rounded-lg object-contain shadow-2xl shadow-black/40"
                  style={{ width: displayedImageWidth, height: displayedImageHeight }}
                />
              </div>
            ) : (
              <div className="relative flex h-full items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gorsel yukleniyor
              </div>
            )}
            <div className="pointer-events-none sticky bottom-4 left-1/2 z-10 flex w-max -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/80 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={imageZoom <= 1}
                className="pointer-events-auto rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                title="Uzaklastir (X)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-16 text-center font-mono text-xs font-bold text-white">{Math.round(imageZoom * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="pointer-events-auto rounded-lg p-2 text-slate-300 hover:bg-white/10"
                title="Yakinlastir (Z)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleFitImage}
                className="pointer-events-auto rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
                title="Fit (F)"
              >
                Fit
              </button>
            </div>
          </div>
        </main>

        <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-slate-700/40 bg-slate-950/55 backdrop-blur-xl">
          <ClassPanel
            classes={activeProject.classes}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            onAddClass={handleAddClass}
            onDeleteClass={handleDeleteClass}
            className="min-h-0 flex-1"
          />
          <div className="border-t border-slate-700/40 p-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Secili sinif</h3>
              <p className="mt-2 text-lg font-bold text-white">{selectedClass?.name || "Sinif secilmedi"}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">1-9 kisayollariyla sinif sec, S ile kaydet ve sonraki gorsele gec.</p>
            </div>
          </div>
        </aside>
      </div>

      <Modal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} title="Keyboard Shortcuts">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <Shortcut k="A" label="Onceki gorsel" />
          <Shortcut k="D" label="Sonraki gorsel" />
          <Shortcut k="S" label="Kaydet" />
          <Shortcut k="Z / X" label="Yakinlastir / uzaklastir" />
          <Shortcut k="F" label="Fit" />
          <Shortcut k="1-9" label="Sinif sec" />
          <Shortcut k="Esc" label="Secimi temizle" />
        </div>
      </Modal>
    </div>
  );
}

function Shortcut({ k, label }: { k: string; label: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-400">
      <span>{label}</span>
      <kbd className="rounded border border-white/10 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-200">
        {k}
      </kbd>
    </div>
  );
}
