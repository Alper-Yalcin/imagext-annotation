import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "../../types/project";
import { ImageItem } from "../../types/image";
import { DetectionAnnotation } from "../../types/annotation";
import { ImageSidebar } from "./ImageSidebar";
import { ClassPanel } from "./ClassPanel";
import { DetectionAnnotationList } from "./DetectionAnnotationList";
import { ArrowLeft, Save, ChevronLeft, ChevronRight, AlertTriangle, MousePointer2, Square, ZoomIn, ZoomOut, Maximize, Keyboard, Hand } from "lucide-react";
import { getDetectionAnnotationsByImageId, replaceDetectionAnnotationsForImage } from "../../storage/annotationStorage";
import { updateImageStatus } from "../../storage/imageStorage";
import { createId } from "../../utils/id";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface YoloAnnotatorProps {
  project: Project;
  initialImages: ImageItem[];
}

type ToolMode = "draw" | "select" | "pan";

export function YoloAnnotator({ project, initialImages }: YoloAnnotatorProps) {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [toolMode, setToolMode] = useState<ToolMode>("draw");
  
  const [boxes, setBoxes] = useState<DetectionAnnotation[]>([]);
  const [savedBoxes, setSavedBoxes] = useState<DetectionAnnotation[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | undefined>(undefined);
  
  const [history, setHistory] = useState<DetectionAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<DetectionAnnotation[][]>([]);
  
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentImage = images[currentIndex];
  // use-image hook to load HTMLImageElement for konva
  const [konvaImage] = useImage(currentImage?.dataUrl || '');

  const isDirty = JSON.stringify(boxes) !== JSON.stringify(savedBoxes);

  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [newBox, setNewBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const transformerRef = useRef<any>(null);

  // Fetch data on load
  useEffect(() => {
    if (currentImage) {
      const annotations = getDetectionAnnotationsByImageId(currentImage.id);
      setBoxes(annotations);
      setSavedBoxes(annotations);
      setHistory([]);
      setRedoStack([]);
      setSelectedBoxId(undefined);
      setToolMode("draw");
      
      // Auto-fit image
      if (containerRef.current) {
         fitToScreen();
      }
    }
  }, [currentIndex, currentImage]);

  // Fit to screen utility
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !currentImage) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;
    
    const padding = 40;
    const scaleX = (clientWidth - padding * 2) / currentImage.width;
    const scaleY = (clientHeight - padding * 2) / currentImage.height;
    
    let newScale = Math.min(scaleX, scaleY);
    if (newScale > 1) newScale = 1; 
    setScale(newScale);
    setStagePos({ x: 0, y: 0 }); // reset pan on fit
  }, [currentImage]);

  useEffect(() => {
    // Attach transformer to selected box
    if (toolMode === "select" && selectedBoxId && transformerRef.current) {
      const node = transformerRef.current.getStage().findOne(`#${selectedBoxId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedBoxId, toolMode, boxes]);

  // Undo / Redo keybinds standard
  useEffect(() => {
    const handleCtrlZ = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          handleUndo();
        } else if (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z")) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener("keydown", handleCtrlZ);
    return () => window.removeEventListener("keydown", handleCtrlZ);
  }, [history, redoStack, boxes]);

  const saveToHistory = () => {
    setHistory([...history, [...boxes]]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prevBoxes = history[history.length - 1];
      setRedoStack([[...boxes], ...redoStack]);
      setBoxes(prevBoxes);
      setHistory(history.slice(0, -1));
      setSelectedBoxId(undefined);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextBoxes = redoStack[0];
      setHistory([...history, [...boxes]]);
      setBoxes(nextBoxes);
      setRedoStack(redoStack.slice(1));
      setSelectedBoxId(undefined);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    if (!currentImage) return;

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = scale;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate mouse position relative to stage (ignoring offset)
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    // Zoom in or out
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 10)); // bounds

    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePos(newPos);
  };

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

  const handleSave = useCallback(async () => {
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
        replaceDetectionAnnotationsForImage(currentImage.id, project.id, boxes);
        await updateImageStatus(currentImage.id, "labeled");
        setSavedBoxes([...boxes]);
        
        setImages(prev => prev.map(img => 
          img.id === currentImage.id ? { ...img, status: "labeled" } : img
        ));

        showToast({ type: "success", title: "Saved", message: "YOLO Annotations saved successfully." });
      } catch (err) {
        showToast({ type: "error", title: "Error", message: "Failed to save annotations." });
      } finally {
        setIsSaving(false);
        
        if (currentIndex < images.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    }, 100);
  }, [boxes, currentImage, project.id, confirm, showToast, currentIndex, images.length]);

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

  const handleDeleteBox = (boxId: string) => {
    saveToHistory();
    setBoxes(boxes.filter(b => b.id !== boxId));
    if (selectedBoxId === boxId) {
      setSelectedBoxId(undefined);
    }
  };

  // Keyboard Shortcuts via Hook
  const shortcutMap = useMemo(() => {
    const map: Record<string, (e: KeyboardEvent) => void> = {
      "A": handlePrev,
      "D": handleNext,
      "S": handleSave,
      "W": () => { setToolMode("draw"); setSelectedBoxId(undefined); },
      "V": () => setToolMode("select"),
      "H": () => setToolMode("pan"),
      "Delete": () => selectedBoxId && handleDeleteBox(selectedBoxId),
      "Backspace": () => selectedBoxId && handleDeleteBox(selectedBoxId),
      "Escape": () => {
        setSelectedBoxId(undefined);
        setIsDrawing(false);
      },
      "?": () => setShowShortcuts(true)
    };

    project.classes.forEach((cls, idx) => {
      if (idx < 9) {
        map[(idx + 1).toString()] = () => {
          setSelectedClassId(cls.id);
          setToolMode("draw");
          setSelectedBoxId(undefined);
        };
      }
    });

    return map;
  }, [handlePrev, handleNext, handleSave, project.classes, selectedBoxId]);

  useKeyboardShortcuts(shortcutMap, !showShortcuts);


  const handleChangeBoxClass = (boxId: string, classId: string) => {
    saveToHistory();
    setBoxes(boxes.map(b => b.id === boxId ? { ...b, classId, updatedAt: new Date().toISOString() } : b));
  };

  // Canvas Interactions
  const getMousePos = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    if (!containerRef.current) return { x: 0, y: 0 };
    const { clientWidth, clientHeight } = containerRef.current;
    
    const stageWidth = clientWidth;
    const stageHeight = clientHeight;
    
    const imgW = currentImage.width * scale;
    const imgH = currentImage.height * scale;
    
    const offsetX = (stageWidth - imgW) / 2 + stagePos.x;
    const offsetY = (stageHeight - imgH) / 2 + stagePos.y;
    
    const x = (pointerPos.x - offsetX) / scale;
    const y = (pointerPos.y - offsetY) / scale;
    
    return { x, y };
  };

  const handleMouseDown = (e: any) => {
    if (e.target.getParent()?.className === 'Transformer') {
      return;
    }

    if (toolMode === "pan") return; // Handled by konva draggable stage

    if (toolMode === "select") {
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-image';
      if (clickedOnEmpty) {
        setSelectedBoxId(undefined);
      }
      return;
    }

    if (toolMode === "draw") {
      if (!selectedClassId) {
        showToast({ type: "warning", title: "Select a Class", message: "Please select a class first to draw a bounding box." });
        return;
      }
      const pos = getMousePos(e);
      if (pos.x < 0 || pos.y < 0 || pos.x > currentImage.width || pos.y > currentImage.height) {
        return;
      }
      setIsDrawing(true);
      setNewBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newBox) return;
    
    const pos = getMousePos(e);
    
    // Clamp to image bounds
    let currX = Math.max(0, Math.min(pos.x, currentImage.width));
    let currY = Math.max(0, Math.min(pos.y, currentImage.height));
    
    setNewBox({
      x: newBox.x,
      y: newBox.y,
      width: currX - newBox.x,
      height: currY - newBox.y
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && newBox) {
      setIsDrawing(false);
      
      // Normalize negative dimensions
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

      // Minimum size threshold to prevent accidental clicks
      if (bw >= 5 && bh >= 5 && selectedClassId) {
        saveToHistory();
        const newAnnotation: DetectionAnnotation = {
          id: createId("box"),
          imageId: currentImage.id,
          projectId: project.id,
          classId: selectedClassId,
          x: bx,
          y: by,
          width: bw,
          height: bh,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setBoxes([...boxes, newAnnotation]);
        setSelectedBoxId(newAnnotation.id);
        setToolMode("select"); // Auto switch to select mode to easily adjust
      }
    }
  };

  const handleDragEnd = (e: any, boxId: string) => {
    // Transformer can mess with x, y during drag. We need to save new pos.
    const node = e.target;
    // node.x() and node.y() are the new values in pixel coordinates since scale is applied to parent group.
    
    let endX = node.x();
    let endY = node.y();
    
    // clamp bounds
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    
    endX = Math.max(0, Math.min(endX, currentImage.width - box.width));
    endY = Math.max(0, Math.min(endY, currentImage.height - box.height));
    
    node.x(endX);
    node.y(endY);

    saveToHistory();
    setBoxes(boxes.map(b => b.id === boxId ? { ...b, x: endX, y: endY, updatedAt: new Date().toISOString() } : b));
  };

  const handleTransformEnd = (e: any, boxId: string) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newX = node.x();
    const newY = node.y();
    let newWidth = Math.max(5, node.width() * scaleX);
    let newHeight = Math.max(5, node.height() * scaleY);
    
    // Additional boundary restrictions could be applied here
    saveToHistory();
    setBoxes(boxes.map(b => b.id === boxId ? { 
      ...b, 
      x: newX, 
      y: newY, 
      width: newWidth, 
      height: newHeight,
      updatedAt: new Date().toISOString() 
    } : b));
  };

  const handleBoxClick = (e: any, boxId: string) => {
    if (toolMode === "select") {
      e.cancelBubble = true;
      setSelectedBoxId(boxId);
    }
  };

  if (!currentImage) return null;

  const stageWidth = containerRef.current?.clientWidth || window.innerWidth / 2;
  const stageHeight = containerRef.current?.clientHeight || window.innerHeight / 2;
  
  const imgW = currentImage.width * scale;
  const imgH = currentImage.height * scale;
  const offsetX = (stageWidth - imgW) / 2;
  const offsetY = (stageHeight - imgH) / 2;

  // Change cursor depending on state
  let cursorClass = "cursor-default";
  if (toolMode === "draw") cursorClass = "cursor-crosshair";
  if (toolMode === "pan") cursorClass = "cursor-grab";

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
        
        {/* Toolbar */}
        <div className="flex flex-1 justify-center px-4">
          <div className="flex items-center bg-zinc-800/80 p-1 rounded-lg gap-1 border border-zinc-700/50">
            <button
              onClick={() => { setToolMode("draw"); setSelectedBoxId(undefined); }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                toolMode === "draw" ? "bg-yellow-500 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
              title="Draw Box (W)"
            >
              <Square className="w-4 h-4" />
              Draw
            </button>
            <button
              onClick={() => setToolMode("select")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                toolMode === "select" ? "bg-yellow-500 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
              title="Select Box (V)"
            >
              <MousePointer2 className="w-4 h-4" />
              Select
            </button>
            <button
              onClick={() => { setToolMode("pan"); setSelectedBoxId(undefined); }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${
                toolMode === "pan" ? "bg-yellow-500 text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
              title="Pan Stage (H)"
            >
              <Hand className="w-4 h-4" />
              Pan
            </button>
            <div className="w-px h-5 bg-zinc-700 mx-1"></div>
            <button onClick={() => setScale(s => s * 1.1)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-500 w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => s / 1.1)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={fitToScreen} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md" title="Fit to Screen">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

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
              disabled={!isDirty || isSaving}
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
        {/* Left Sidebar */}
        <ImageSidebar 
          images={images} 
          currentImageId={currentImage.id} 
          onSelectImage={handleSelectImage} 
        />

        {/* Center Viewer & Canvas */}
        <div className="flex-1 flex flex-col bg-zinc-950 p-6 relative">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div>
              <h2 className="text-lg font-medium text-white">{currentImage.name}</h2>
              <p className="text-sm text-zinc-500">{currentImage.width} × {currentImage.height} px</p>
            </div>
            {isDirty && (
              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-medium bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 shadow-sm shadow-amber-500/10">
                <AlertTriangle className="w-4 h-4" />
                Unsaved changes
              </div>
            )}
          </div>
          <div 
            className={`flex-1 min-h-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden ${cursorClass}`}
            ref={containerRef}
          >
            {/* Konva Canvas */}
            <Stage 
              width={stageWidth} 
              height={stageHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              draggable={toolMode === "pan"}
              x={stagePos.x}
              y={stagePos.y}
              onDragEnd={(e) => {
                if (e.target === e.target.getStage()) {
                  setStagePos({ x: e.target.x(), y: e.target.y() });
                }
              }}
            >
              <Layer>
                <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
                  <KonvaImage 
                    image={konvaImage} 
                    width={currentImage.width} 
                    height={currentImage.height}
                    name="background-image"
                  />
                  
                  {/* Render existing boxes */}
                  {boxes.map((box) => {
                    const boxClass = project.classes.find(c => c.id === box.classId);
                    const color = boxClass?.color || "#eab308";
                    const isSelected = box.id === selectedBoxId;
                    return (
                      <Rect
                        key={box.id}
                        id={box.id}
                        x={box.x}
                        y={box.y}
                        width={box.width}
                        height={box.height}
                        stroke={color}
                        strokeWidth={isSelected ? 3 / scale : 2 / scale}
                        fill={color + "33"} // 20% opacity using hex
                        draggable={toolMode === "select" && isSelected}
                        onClick={(e) => handleBoxClick(e, box.id)}
                        onDragEnd={(e) => handleDragEnd(e, box.id)}
                        onTransformEnd={(e) => handleTransformEnd(e, box.id)}
                      />
                    );
                  })}
                  
                  {/* Render drawing box */}
                  {isDrawing && newBox && (
                    <Rect
                      x={newBox.x < 0 ? newBox.x + newBox.width : newBox.x}
                      y={newBox.y < 0 ? newBox.y + newBox.height : newBox.y}
                      width={Math.abs(newBox.width)}
                      height={Math.abs(newBox.height)}
                      stroke={project.classes.find(c => c.id === selectedClassId)?.color || "#eab308"}
                      strokeWidth={2 / scale}
                      fill={(project.classes.find(c => c.id === selectedClassId)?.color || "#eab308") + "33"}
                    />
                  )}
                  
                  {/* Transformer attached dynamically */}
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // limit resize
                      if (newBox.width < 5 || newBox.height < 5) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                    rotateEnabled={false}
                    ignoreStroke={true}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
                    anchorSize={8 / scale}
                    borderStroke="#ffffff"
                    borderStrokeWidth={1 / scale}
                    anchorStroke="#ffffff"
                    anchorFill="#eab308"
                  />
                </Group>
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 flex flex-col border-l border-zinc-800 bg-zinc-900">
           <div className="h-1/2 flex flex-col">
             <ClassPanel 
                classes={project.classes} 
                selectedClassId={selectedClassId}
                onSelectClass={(id) => {
                  setSelectedClassId(id);
                  if (toolMode !== "draw") {
                    setToolMode("draw");
                    setSelectedBoxId(undefined);
                  }
                }}
              />
           </div>
           <div className="h-1/2 flex flex-col border-t border-zinc-800">
              <DetectionAnnotationList
                boxes={boxes}
                classes={project.classes}
                selectedBoxId={selectedBoxId}
                onSelectBox={(id) => {
                  setToolMode("select");
                  setSelectedBoxId(id);
                }}
                onDeleteBox={handleDeleteBox}
                onChangeBoxClass={handleChangeBoxClass}
              />
           </div>
        </div>
      </div>

      <Modal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} title="YOLO Shortcuts">
         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-y-2">
              <div className="text-zinc-400">Previous / Next Image</div>
              <div className="flex items-center justify-end gap-2">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">A</kbd> / <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">D</kbd>
              </div>
              <div className="text-zinc-400">Save Annotation</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">S</kbd>
              </div>
              <div className="text-zinc-400">Select Tool</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">V</kbd>
              </div>
              <div className="text-zinc-400">Draw Tool</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">W</kbd>
              </div>
              <div className="text-zinc-400">Pan Tool</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">H</kbd>
              </div>
              <div className="text-zinc-400">Delete Box</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">Del</kbd>
              </div>
              <div className="text-zinc-400">Select Class</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">1-9</kbd>
              </div>
              <div className="text-zinc-400">Undo / Redo</div>
              <div className="flex items-center justify-end">
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white">Ctrl+Z / Y</kbd>
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
