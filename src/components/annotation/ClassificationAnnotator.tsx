import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "../../types/project";
import { ImageItem } from "../../types/image";
import { ImageSidebar } from "./ImageSidebar";
import { ClassPanel } from "./ClassPanel";
import { ArrowLeft, Save, ChevronLeft, ChevronRight, AlertTriangle, Keyboard } from "lucide-react";
import { getClassificationAnnotationByImageId, upsertClassificationAnnotation } from "../../storage/annotationStorage";
import { updateImageStatus } from "../../storage/imageStorage";
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
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [savedClassId, setSavedClassId] = useState<string | undefined>(undefined);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const currentImage = images[currentIndex];
  const isDirty = selectedClassId !== savedClassId;

  // Track if saving to prevent multiple clicks
  const [isSaving, setIsSaving] = useState(false);

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
        variant: "danger"
      });
      if (!isConfirmed) return;
    }
    setCurrentIndex(newIndex);
  };

  const handleSelectImage = (imageId: string) => {
    const idx = images.findIndex(img => img.id === imageId);
    if (idx !== -1 && idx !== currentIndex) {
      requestImageChange(idx);
    }
  };

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      requestImageChange(currentIndex - 1);
    }
  }, [currentIndex, isDirty, confirm]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      requestImageChange(currentIndex + 1);
    }
  }, [currentIndex, images.length, isDirty, confirm]);

  const handleSave = useCallback(() => {
    if (!selectedClassId) {
      showToast({ type: "warning", title: "No Class Selected", message: "Please select a class before saving." });
      return;
    }
    if (!isDirty) return;

    setIsSaving(true);
    
    // Tiny delay to show saving state and batch updates if possible
    setTimeout(async () => {
      try {
        upsertClassificationAnnotation({
          imageId: currentImage.id,
          projectId: project.id,
          classId: selectedClassId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        await updateImageStatus(currentImage.id, "labeled");
        setSavedClassId(selectedClassId);
        
        setImages(prev => prev.map(img => 
          img.id === currentImage.id ? { ...img, status: "labeled" } : img
        ));

        showToast({ type: "success", title: "Saved", message: "Annotation saved successfully.", duration: 2000 });
      } catch (err) {
        showToast({ type: "error", title: "Error", message: "Failed to save annotation." });
      } finally {
        setIsSaving(false);
        
        // Auto move to next image
        if (currentIndex < images.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    }, 100);
    
  }, [selectedClassId, isDirty, currentImage, project.id, currentIndex, images.length, showToast]);

  const handleBackToProject = async () => {
    if (isDirty) {
      const isConfirmed = await confirm({
        title: "Unsaved Changes",
        message: "You have unsaved changes. Return to project without saving?",
        confirmLabel: "Discard Changes",
        variant: "danger"
      });
      if (!isConfirmed) return;
    }
    navigate(`/projects/${project.id}`);
  };

  // Keyboard Shortcuts
  const shortcutMap = useMemo(() => {
    const map: Record<string, (e: KeyboardEvent) => void> = {
      "A": handlePrev,
      "D": handleNext,
      "S": handleSave,
      "Escape": () => setSelectedClassId(undefined),
      "?": () => setShowShortcuts(true),
    };

    project.classes.forEach((cls, idx) => {
      if (idx < 9) {
        map[(idx + 1).toString()] = () => setSelectedClassId(cls.id);
      }
    });

    return map;
  }, [handlePrev, handleNext, handleSave, project.classes]);

  useKeyboardShortcuts(shortcutMap, !showShortcuts);

  if (!currentImage) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <button 
          onClick={handleBackToProject}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
              title="Previous Image (A)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-zinc-500 text-sm w-16 text-center">
              {currentIndex + 1} / {images.length}
            </span>
            <button 
              onClick={handleNext} 
              disabled={currentIndex === images.length - 1}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
              title="Next Image (D)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="w-px h-6 bg-zinc-800"></div>

          <div className="flex items-center gap-2">
            <button
               onClick={() => setShowShortcuts(true)}
               className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
               title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <Button
              onClick={handleSave}
              disabled={!selectedClassId || !isDirty || isSaving}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-900 border-transparent shadow shadow-yellow-500/10"
              title="Save Annotation (S)"
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex flex-1 min-h-0">
        <ImageSidebar 
          images={images} 
          currentImageId={currentImage.id} 
          onSelectImage={handleSelectImage} 
        />

        <div className="flex-1 flex flex-col bg-zinc-950 p-6 relative">
          <div className="flex justify-between items-center mb-4 shrink-0 transition-opacity">
            <div>
              <h2 className="text-lg font-medium text-white">{currentImage.name}</h2>
              <p className="text-sm text-zinc-500">{currentImage.width} × {currentImage.height} px</p>
            </div>
            {isDirty && (
              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-medium bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 animate-in fade-in zoom-in-95 duration-200">
                <AlertTriangle className="w-4 h-4" />
                Unsaved changes
              </div>
            )}
            {!isDirty && savedClassId && (
              <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 transition-all">
                 Saved
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center p-4">
             <img 
              key={currentImage.id} // Re-render image nicely on change
              src={currentImage.dataUrl} 
              alt={currentImage.name} 
              className="max-w-full max-h-full object-contain rounded-md animate-in fade-in duration-300" 
            />
          </div>
        </div>

        <ClassPanel 
          classes={project.classes} 
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
        />
      </div>

      <Modal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} title="Keyboard Shortcuts">
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-y-2">
              <div className="text-zinc-400">Previous Image</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">A</kbd>
              </div>
              <div className="text-zinc-400">Next Image</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">D</kbd>
              </div>
              <div className="text-zinc-400">Save Annotation</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">S</kbd>
              </div>
              <div className="text-zinc-400">Select Class</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">1-9</kbd>
              </div>
              <div className="text-zinc-400">Clear Selection</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">ESC</kbd>
              </div>
            </div>
         </div>
      </Modal>
    </div>
  );
}
