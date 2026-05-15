import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Loader2,
  Save,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import useImage from "use-image";
import { Project } from "../../types/project";
import { ImageItem, ImageMeta } from "../../types/image";
import { DetectionAnnotation } from "../../types/annotation";
import { ImageSidebar } from "./ImageSidebar";
import { ClassPanel } from "./ClassPanel";
import { DetectionAnnotationList } from "./DetectionAnnotationList";
import { AnnotationToolbar, AnnotationToolMode } from "./AnnotationToolbar";
import { DetectionCanvas } from "./DetectionCanvas";
import {
  deleteClassificationAnnotationByImageId,
  deleteDetectionAnnotationsByClassId,
  deleteDetectionAnnotationsByImageId,
  getDetectionAnnotationsByImageId,
  getDetectionAnnotationsByProjectId,
  replaceDetectionAnnotationsForImage,
} from "../../storage/annotationStorage";
import { deleteImage, getImageById, updateImageStatus } from "../../storage/imageStorage";
import { updateProject } from "../../storage/projectStorage";
import { createId } from "../../utils/id";
import { getClassColor } from "../../utils/classColor";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface YoloAnnotatorProps {
  project: Project;
  initialImages: ImageMeta[];
}

export function YoloAnnotator({ project, initialImages }: YoloAnnotatorProps) {
  const navigate = useNavigate();
  const [activeProject, setActiveProject] = useState<Project>(project);
  const [images, setImages] = useState<ImageMeta[]>(initialImages);
  const [currentImage, setCurrentImage] = useState<ImageItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();
  const [toolMode, setToolMode] = useState<AnnotationToolMode>("draw");
  const [boxes, setBoxes] = useState<DetectionAnnotation[]>([]);
  const [savedBoxes, setSavedBoxes] = useState<DetectionAnnotation[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | undefined>();
  const [history, setHistory] = useState<DetectionAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<DetectionAnnotation[][]>([]);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<any>(null);
  const currentImageMeta = images[currentIndex];
  const [konvaImage] = useImage(currentImage?.dataUrl || "");
  const isDirty = JSON.stringify(boxes) !== JSON.stringify(savedBoxes);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [imageClassIdsByImageId, setImageClassIdsByImageId] = useState<Record<string, string[]>>(() => {
    const map: Record<string, Set<string>> = {};
    getDetectionAnnotationsByProjectId(project.id).forEach((annotation) => {
      map[annotation.imageId] = map[annotation.imageId] || new Set<string>();
      map[annotation.imageId].add(annotation.classId);
    });

    return Object.fromEntries(Object.entries(map).map(([imageId, classIds]) => [imageId, Array.from(classIds)]));
  });

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !currentImage) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const padding = 56;
    const scaleX = (clientWidth - padding * 2) / currentImage.width;
    const scaleY = (clientHeight - padding * 2) / currentImage.height;
    setScale(Math.min(1, Math.max(0.1, Math.min(scaleX, scaleY))));
    setStagePos({ x: 0, y: 0 });
  }, [currentImage]);

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
    if (currentImage) {
      const annotations = getDetectionAnnotationsByImageId(currentImage.id);
      setBoxes(annotations);
      setSavedBoxes(annotations);
      setHistory([]);
      setRedoStack([]);
      setSelectedBoxId(undefined);
      setToolMode("draw");
      window.requestAnimationFrame(fitToScreen);
    }
  }, [currentIndex, currentImage, fitToScreen]);

  useEffect(() => {
    if (toolMode === "select" && selectedBoxId && transformerRef.current) {
      const node = transformerRef.current.getStage().findOne(`#${selectedBoxId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedBoxId, toolMode, boxes]);

  const saveToHistory = () => {
    setHistory((prev) => [...prev, [...boxes]]);
    setRedoStack([]);
  };

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const previousBoxes = prev[prev.length - 1];
      setRedoStack((redo) => [[...boxes], ...redo]);
      setBoxes(previousBoxes);
      setSelectedBoxId(undefined);
      return prev.slice(0, -1);
    });
  }, [boxes]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const nextBoxes = prev[0];
      setHistory((historyItems) => [...historyItems, [...boxes]]);
      setBoxes(nextBoxes);
      setSelectedBoxId(undefined);
      return prev.slice(1);
    });
  }, [boxes]);

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

  const handleSave = useCallback(async () => {
    if (!currentImage) return;
    if (boxes.length === 0) {
      const goAhead = await confirm({
        title: "No Annotations",
        message: "There are no boxes. Save this image as labeled anyway?",
        confirmLabel: "Save Anyway",
      });
      if (!goAhead) return;
    }

    setIsSaving(true);
    setTimeout(async () => {
      try {
        replaceDetectionAnnotationsForImage(currentImage.id, activeProject.id, boxes);
        await updateImageStatus(currentImage.id, "labeled", activeProject.id);
        setSavedBoxes([...boxes]);
        setImages((prev) => prev.map((img) => (img.id === currentImage.id ? { ...img, status: "labeled" } : img)));
        setImageClassIdsByImageId((prev) => ({
          ...prev,
          [currentImage.id]: Array.from(new Set(boxes.map((box) => box.classId))),
        }));
        showToast({ type: "success", title: "Saved", message: "YOLO annotations saved successfully." });
      } catch {
        showToast({ type: "error", title: "Error", message: "Failed to save annotations." });
      } finally {
        setIsSaving(false);
        if (currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
      }
    }, 100);
  }, [boxes, currentImage, activeProject.id, confirm, showToast, currentIndex, images.length]);

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

  const handleDeleteBox = useCallback(
    (boxId: string) => {
      saveToHistory();
      setBoxes((prev) => prev.filter((b) => b.id !== boxId));
      if (selectedBoxId === boxId) setSelectedBoxId(undefined);
    },
    [boxes, selectedBoxId],
  );

  const handleChangeBoxClass = (boxId: string, classId: string) => {
    saveToHistory();
    setBoxes((prev) => prev.map((b) => (b.id === boxId ? { ...b, classId, updatedAt: new Date().toISOString() } : b)));
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
    setToolMode("draw");
    setSelectedBoxId(undefined);
    showToast({ type: "success", title: "Class added", message: `"${trimmedName}" is ready to use.` });
    return true;
  };

  const handleDeleteClass = async (classId: string) => {
    const targetClass = activeProject.classes.find(cls => cls.id === classId);
    if (!targetClass) return;

    const affectedCurrentBoxes = boxes.filter(box => box.classId === classId).length;
    const confirmed = await confirm({
      title: "Delete Class",
      message: `Delete "${targetClass.name}"? Existing annotations using this class will also be removed.`,
      confirmLabel: "Delete Class",
      variant: "danger",
    });
    if (!confirmed) return;

    const updatedProject = {
      ...activeProject,
      classes: activeProject.classes.filter(cls => cls.id !== classId),
    };

    deleteDetectionAnnotationsByClassId(activeProject.id, classId);
    updateProject(updatedProject);
    setActiveProject(updatedProject);
    setBoxes(prev => prev.filter(box => box.classId !== classId));
    setSavedBoxes(prev => prev.filter(box => box.classId !== classId));
    setImageClassIdsByImageId((prev) => {
      const next: Record<string, string[]> = {};
      Object.entries(prev).forEach(([imageId, classIds]) => {
        const remainingClassIds = classIds.filter((id) => id !== classId);
        if (remainingClassIds.length > 0) next[imageId] = remainingClassIds;
      });
      return next;
    });
    setHistory([]);
    setRedoStack([]);
    if (selectedClassId === classId) setSelectedClassId(undefined);
    if (selectedBoxId && boxes.find(box => box.id === selectedBoxId)?.classId === classId) setSelectedBoxId(undefined);

    showToast({
      type: "info",
      title: "Class deleted",
      message: affectedCurrentBoxes > 0
        ? `"${targetClass.name}" and ${affectedCurrentBoxes} current annotations were removed.`
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
      setBoxes([]);
      setSavedBoxes([]);
      setHistory([]);
      setRedoStack([]);
      setSelectedBoxId(undefined);
      setIsDrawing(false);
      setNewBox(null);
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

  const getMousePos = (event: any) => {
    const stage = event.target.getStage();
    const pointerPos = stage.getPointerPosition();
    if (!containerRef.current || !currentImage) return { x: 0, y: 0 };

    const { clientWidth, clientHeight } = containerRef.current;
    const imgW = currentImage.width * scale;
    const imgH = currentImage.height * scale;
    const offsetX = (clientWidth - imgW) / 2 + stagePos.x;
    const offsetY = (clientHeight - imgH) / 2 + stagePos.y;

    return {
      x: (pointerPos.x - offsetX) / scale,
      y: (pointerPos.y - offsetY) / scale,
    };
  };

  const handleWheel = (event: any) => {
    event.evt.preventDefault();
    if (!currentImage) return;

    const scaleBy = 1.1;
    const stage = event.target.getStage();
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const nextScale = Math.max(0.1, Math.min(10, event.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy));
    setScale(nextScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale,
    });
  };

  const handleMouseDown = (event: any) => {
    if (!currentImage) return;
    if (event.target.getParent()?.className === "Transformer") return;
    if (toolMode === "pan") return;

    if (toolMode === "select") {
      const clickedOnEmpty = event.target === event.target.getStage() || event.target.name() === "background-image";
      if (clickedOnEmpty) setSelectedBoxId(undefined);
      return;
    }

    if (!selectedClassId) {
      showToast({ type: "warning", title: "Select a Class", message: "Please select a class first to draw a bounding box." });
      return;
    }

    const pos = getMousePos(event);
    if (pos.x < 0 || pos.y < 0 || pos.x > currentImage.width || pos.y > currentImage.height) return;
    setIsDrawing(true);
    setNewBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (event: any) => {
    if (!isDrawing || !newBox || !currentImage) return;
    const pos = getMousePos(event);
    const currX = Math.max(0, Math.min(pos.x, currentImage.width));
    const currY = Math.max(0, Math.min(pos.y, currentImage.height));
    setNewBox({ x: newBox.x, y: newBox.y, width: currX - newBox.x, height: currY - newBox.y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !newBox || !currentImage || !selectedClassId) return;
    setIsDrawing(false);

    let bx = newBox.x;
    let by = newBox.y;
    let bw = newBox.width;
    let bh = newBox.height;
    if (bw < 0) {
      bx += bw;
      bw = Math.abs(bw);
    }
    if (bh < 0) {
      by += bh;
      bh = Math.abs(bh);
    }
    setNewBox(null);

    if (bw >= 5 && bh >= 5) {
      saveToHistory();
      const newAnnotation: DetectionAnnotation = {
        id: createId("box"),
        imageId: currentImage.id,
        projectId: activeProject.id,
        classId: selectedClassId,
        x: bx,
        y: by,
        width: bw,
        height: bh,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBoxes((prev) => [...prev, newAnnotation]);
      setSelectedBoxId(newAnnotation.id);
      setToolMode("select");
    }
  };

  const handleDragEnd = (event: any, boxId: string) => {
    if (!currentImage) return;
    const node = event.target;
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return;

    const endX = Math.max(0, Math.min(node.x(), currentImage.width - box.width));
    const endY = Math.max(0, Math.min(node.y(), currentImage.height - box.height));
    node.x(endX);
    node.y(endY);

    saveToHistory();
    setBoxes((prev) => prev.map((b) => (b.id === boxId ? { ...b, x: endX, y: endY, updatedAt: new Date().toISOString() } : b)));
  };

  const handleTransformEnd = (event: any, boxId: string) => {
    const node = event.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    saveToHistory();
    setBoxes((prev) =>
      prev.map((b) =>
        b.id === boxId
          ? {
              ...b,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
              updatedAt: new Date().toISOString(),
            }
          : b,
      ),
    );
  };

  const handleBoxClick = (event: any, boxId: string) => {
    if (toolMode === "select") {
      event.cancelBubble = true;
      setSelectedBoxId(boxId);
    }
  };

  const selectedBox = boxes.find((box) => box.id === selectedBoxId);
  const selectedBoxClass = selectedBox ? activeProject.classes.find((cls) => cls.id === selectedBox.classId) : undefined;

  const shortcutMap = useMemo(() => {
    const map: Record<string, (event: KeyboardEvent) => void> = {
      A: handlePrev,
      D: handleNext,
      S: handleSave,
      W: () => {
        setToolMode("draw");
        setSelectedBoxId(undefined);
      },
      V: () => setToolMode("select"),
      H: () => {
        setToolMode("pan");
        setSelectedBoxId(undefined);
      },
      F: fitToScreen,
      Z: () => setScale((value) => Math.min(10, value * 1.1)),
      X: () => setScale((value) => Math.max(0.1, value / 1.1)),
      Delete: () => selectedBoxId && handleDeleteBox(selectedBoxId),
      Backspace: () => selectedBoxId && handleDeleteBox(selectedBoxId),
      Escape: () => {
        setSelectedBoxId(undefined);
        setIsDrawing(false);
      },
      "?": () => setShowShortcuts(true),
    };

    activeProject.classes.forEach((cls, idx) => {
      if (idx < 9) {
        map[(idx + 1).toString()] = () => {
          setSelectedClassId(cls.id);
          setToolMode("draw");
          setSelectedBoxId(undefined);
        };
      }
    });

    return map;
  }, [handlePrev, handleNext, handleSave, activeProject.classes, selectedBoxId, handleDeleteBox, fitToScreen]);

  useKeyboardShortcuts(shortcutMap, !showShortcuts);

  if (!currentImageMeta) return null;

  const stageWidth = containerRef.current?.clientWidth || window.innerWidth / 2;
  const stageHeight = containerRef.current?.clientHeight || window.innerHeight / 2;
  const cursorClass = toolMode === "draw" ? "cursor-crosshair" : toolMode === "pan" ? "cursor-grab" : "cursor-default";

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-app-bg text-slate-100">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/40 bg-slate-950/70 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackToProject}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {activeProject.name}
          </button>
          <div className="hidden h-7 w-px bg-slate-700/60 lg:block" />
          <div className="hidden items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-950/70 px-3 py-2 text-sm font-bold text-white lg:flex">
            <button type="button" onClick={handlePrev} disabled={currentIndex === 0} className="text-slate-400 hover:text-white disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{currentIndex + 1} / {images.length}</span>
            <button type="button" onClick={handleNext} disabled={currentIndex === images.length - 1} className="text-slate-400 hover:text-white disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AnnotationToolbar
          toolMode={toolMode}
          scale={scale}
          canUndo={history.length > 0}
          canRedo={redoStack.length > 0}
          canDelete={Boolean(selectedBoxId)}
          onSetToolMode={(mode) => {
            setToolMode(mode);
            if (mode !== "select") setSelectedBoxId(undefined);
          }}
          onZoomIn={() => setScale((value) => Math.min(10, value * 1.1))}
          onZoomOut={() => setScale((value) => Math.max(0.1, value / 1.1))}
          onFit={fitToScreen}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={() => selectedBoxId && handleDeleteBox(selectedBoxId)}
        />

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
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
            title="Save Annotation (S)"
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

        <main className="relative flex min-w-0 flex-1 flex-col bg-slate-950/35">
          <div className="flex items-center justify-between border-b border-slate-700/30 px-5 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">{currentImageMeta.name}</h2>
              <p className="text-xs text-slate-500">
                {currentImageMeta.width}x{currentImageMeta.height}px - {boxes.length} box
              </p>
            </div>
            {isDirty && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Kaydedilmemis degisiklikler
              </div>
            )}
          </div>

          <div ref={containerRef} className="min-h-0 flex-1 p-4">
            {currentImage ? (
              <DetectionCanvas
                project={activeProject}
                currentImage={currentImage}
                konvaImage={konvaImage || undefined}
                boxes={boxes}
                selectedBoxId={selectedBoxId}
                selectedClassId={selectedClassId}
                toolMode={toolMode}
                scale={scale}
                stagePos={stagePos}
                transformerRef={transformerRef}
                isDrawing={isDrawing}
                newBox={newBox}
                cursorClass={cursorClass}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onStageDragEnd={setStagePos}
                onBoxClick={handleBoxClick}
                onBoxDragEnd={handleDragEnd}
                onBoxTransformEnd={handleTransformEnd}
              />
            ) : (
              <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gorsel yukleniyor
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-950/80 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <button type="button" onClick={() => setScale((value) => Math.max(0.1, value / 1.1))} className="pointer-events-auto rounded-lg p-2 text-slate-300 hover:bg-white/10">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-16 text-center font-mono text-xs font-bold text-white">{Math.round(scale * 100)}%</span>
            <button type="button" onClick={() => setScale((value) => Math.min(10, value * 1.1))} className="pointer-events-auto rounded-lg p-2 text-slate-300 hover:bg-white/10">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" onClick={fitToScreen} className="pointer-events-auto rounded-lg px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10">
              Fit
            </button>
          </div>
        </main>

        <aside className="flex h-full w-[420px] shrink-0 border-l border-slate-700/40 bg-slate-950/55 backdrop-blur-xl">
          <div className="flex min-w-0 flex-1 flex-col border-r border-slate-700/40">
            <ClassPanel
              classes={activeProject.classes}
              selectedClassId={selectedClassId}
              onAddClass={handleAddClass}
              onDeleteClass={handleDeleteClass}
              onSelectClass={(id) => {
                setSelectedClassId(id);
                setToolMode("draw");
                setSelectedBoxId(undefined);
              }}
              className="min-h-[38%] border-b border-slate-700/40"
              compact
            />
            <DetectionAnnotationList
              boxes={boxes}
              classes={activeProject.classes}
              selectedBoxId={selectedBoxId}
              onSelectBox={(id) => {
                setToolMode("select");
                setSelectedBoxId(id);
              }}
              onDeleteBox={handleDeleteBox}
              onChangeBoxClass={handleChangeBoxClass}
            />
          </div>

          <div className="hidden w-[180px] flex-col p-3 xl:flex">
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Secili Annotation</h3>
              {selectedBox ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-slate-500">Sinif</p>
                    <p className="mt-1 font-bold text-white">{selectedBoxClass?.name || "Unknown"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-slate-300">
                    <Metric label="x" value={selectedBox.x} />
                    <Metric label="y" value={selectedBox.y} />
                    <Metric label="w" value={selectedBox.width} />
                    <Metric label="h" value={selectedBox.height} />
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteBox(selectedBox.id)}>
                    Sil
                  </Button>
                </div>
              ) : (
                <p className="text-xs leading-5 text-slate-500">Bir kutu secildiginde koordinatlar burada gorunur.</p>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Klavye Kisayollari</h3>
              <Shortcut k="W" label="Kutu ciz" />
              <Shortcut k="V" label="Secim modu" />
              <Shortcut k="H" label="Tasima modu" />
              <Shortcut k="S" label="Kaydet" />
              <Shortcut k="Del" label="Sil" />
            </div>
          </div>
        </aside>
      </div>

      <Modal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} title="YOLO Shortcuts">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <Shortcut k="A / D" label="Onceki / Sonraki gorsel" />
          <Shortcut k="S" label="Kaydet ve sonraki" />
          <Shortcut k="W" label="Kutu ciz" />
          <Shortcut k="V" label="Secim modu" />
          <Shortcut k="H" label="Tasima modu" />
          <Shortcut k="1-9" label="Sinif sec" />
          <Shortcut k="Ctrl+Z / Y" label="Geri / ileri al" />
          <Shortcut k="Esc" label="Secimi temizle" />
        </div>
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-950/70 p-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-xs font-bold text-white">{Math.round(value)}</p>
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
