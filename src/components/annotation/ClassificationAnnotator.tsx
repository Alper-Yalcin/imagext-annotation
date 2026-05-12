import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Keyboard, Save } from "lucide-react";
import { Project } from "../../types/project";
import { ImageItem } from "../../types/image";
import { ImageSidebar } from "./ImageSidebar";
import { ClassPanel } from "./ClassPanel";
import {
  deleteClassificationAnnotationsByClassId,
  getClassificationAnnotationByImageId,
  getClassificationAnnotationsByProjectId,
  upsertClassificationAnnotation,
} from "../../storage/annotationStorage";
import { updateImageStatus } from "../../storage/imageStorage";
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
  initialImages: ImageItem[];
}

export function ClassificationAnnotator({ project, initialImages }: ClassificationAnnotatorProps) {
  const navigate = useNavigate();
  const [activeProject, setActiveProject] = useState<Project>(project);
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [savedClassId, setSavedClassId] = useState<string | undefined>();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const currentImage = images[currentIndex];
  const isDirty = selectedClassId !== savedClassId;
  const selectedClass = activeProject.classes.find((cls) => cls.id === selectedClassId);

  useEffect(() => {
    if (currentImage) {
      const annotation = getClassificationAnnotationByImageId(currentImage.id);
      setSelectedClassId(annotation?.classId);
      setSavedClassId(annotation?.classId);
    }
  }, [currentIndex, currentImage]);

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

        await updateImageStatus(currentImage.id, "labeled");
        setSavedClassId(selectedClassId);
        setImages((prev) => prev.map((img) => (img.id === currentImage.id ? { ...img, status: "labeled" } : img)));
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
    await Promise.all(Array.from(affectedImageIds).map(imageId => updateImageStatus(imageId, "unlabeled")));

    setActiveProject(updatedProject);
    setImages(prev => prev.map(img => affectedImageIds.has(img.id) ? { ...img, status: "unlabeled" } : img));
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

  const shortcutMap = useMemo(() => {
    const map: Record<string, (event: KeyboardEvent) => void> = {
      A: handlePrev,
      D: handleNext,
      S: handleSave,
      Escape: () => setSelectedClassId(undefined),
      "?": () => setShowShortcuts(true),
    };

    activeProject.classes.forEach((cls, idx) => {
      if (idx < 9) map[(idx + 1).toString()] = () => setSelectedClassId(cls.id);
    });

    return map;
  }, [handlePrev, handleNext, handleSave, activeProject.classes]);

  useKeyboardShortcuts(shortcutMap, !showShortcuts);

  if (!currentImage) return null;

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
        <ImageSidebar images={images} currentImageId={currentImage.id} onSelectImage={handleSelectImage} />

        <main className="flex min-w-0 flex-1 flex-col bg-slate-950/35 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">{currentImage.name}</h2>
              <p className="text-xs text-slate-500">
                {currentImage.width}x{currentImage.height}px · classification
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

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-slate-950">
            <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.18)_1px,transparent_1px)] [background-size:32px_32px]" />
            <img
              key={currentImage.id}
              src={currentImage.dataUrl}
              alt={currentImage.name}
              className="relative max-h-full max-w-full rounded-lg object-contain shadow-2xl shadow-black/40"
            />
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
