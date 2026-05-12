import { RefObject } from "react";
import { Group, Image as KonvaImage, Label, Layer, Rect, Stage, Tag, Text, Transformer } from "react-konva";
import { DetectionAnnotation } from "../../types/annotation";
import { ImageItem } from "../../types/image";
import { Project } from "../../types/project";
import { getClassColor } from "../../utils/classColor";
import { AnnotationToolMode } from "./AnnotationToolbar";

interface DetectionCanvasProps {
  project: Project;
  currentImage: ImageItem;
  konvaImage?: HTMLImageElement;
  boxes: DetectionAnnotation[];
  selectedBoxId?: string;
  selectedClassId?: string;
  toolMode: AnnotationToolMode;
  scale: number;
  stagePos: { x: number; y: number };
  transformerRef: RefObject<any>;
  isDrawing: boolean;
  newBox: { x: number; y: number; width: number; height: number } | null;
  cursorClass: string;
  stageWidth: number;
  stageHeight: number;
  onMouseDown: (event: any) => void;
  onMouseMove: (event: any) => void;
  onMouseUp: () => void;
  onWheel: (event: any) => void;
  onStageDragEnd: (position: { x: number; y: number }) => void;
  onBoxClick: (event: any, boxId: string) => void;
  onBoxDragEnd: (event: any, boxId: string) => void;
  onBoxTransformEnd: (event: any, boxId: string) => void;
}

export function DetectionCanvas({
  project,
  currentImage,
  konvaImage,
  boxes,
  selectedBoxId,
  selectedClassId,
  toolMode,
  scale,
  stagePos,
  transformerRef,
  isDrawing,
  newBox,
  cursorClass,
  stageWidth,
  stageHeight,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onStageDragEnd,
  onBoxClick,
  onBoxDragEnd,
  onBoxTransformEnd,
}: DetectionCanvasProps) {
  const imgW = currentImage.width * scale;
  const imgH = currentImage.height * scale;
  const offsetX = (stageWidth - imgW) / 2;
  const offsetY = (stageHeight - imgH) / 2;
  const selectedClass = project.classes.find((c) => c.id === selectedClassId);
  const drawingColor = selectedClass?.color || getClassColor(selectedClass?.name || "draw");

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-xl border border-slate-700/50 bg-slate-950 ${cursorClass}`}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.18)_1px,transparent_1px)] [background-size:32px_32px]" />
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        draggable={toolMode === "pan"}
        x={stagePos.x}
        y={stagePos.y}
        onDragEnd={(event) => {
          if (event.target === event.target.getStage()) {
            onStageDragEnd({ x: event.target.x(), y: event.target.y() });
          }
        }}
      >
        <Layer>
          <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
            <KonvaImage image={konvaImage} width={currentImage.width} height={currentImage.height} name="background-image" />

            {boxes.map((box, index) => {
              const boxClass = project.classes.find((c) => c.id === box.classId);
              const color = boxClass?.color || getClassColor(boxClass?.name || "box", index);
              const isSelected = box.id === selectedBoxId;

              return (
                <Group key={box.id}>
                  <Rect
                    id={box.id}
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    stroke={color}
                    strokeWidth={isSelected ? 3 / scale : 2 / scale}
                    fill={`${color}26`}
                    draggable={toolMode === "select" && isSelected}
                    onClick={(event) => onBoxClick(event, box.id)}
                    onDragEnd={(event) => onBoxDragEnd(event, box.id)}
                    onTransformEnd={(event) => onBoxTransformEnd(event, box.id)}
                  />
                  <Label x={box.x} y={Math.max(0, box.y - 22 / scale)} scaleX={1 / scale} scaleY={1 / scale}>
                    <Tag fill={color} cornerRadius={4} />
                    <Text text={boxClass?.name || "Class"} fill="#ffffff" fontSize={12} fontStyle="bold" padding={5} />
                  </Label>
                </Group>
              );
            })}

            {isDrawing && newBox && (
              <Rect
                x={newBox.width < 0 ? newBox.x + newBox.width : newBox.x}
                y={newBox.height < 0 ? newBox.y + newBox.height : newBox.y}
                width={Math.abs(newBox.width)}
                height={Math.abs(newBox.height)}
                stroke={drawingColor}
                strokeWidth={2 / scale}
                fill={`${drawingColor}26`}
              />
            )}

            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={false}
              ignoreStroke={true}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "top-center",
                "bottom-center",
                "middle-left",
                "middle-right",
              ]}
              anchorSize={8 / scale}
              borderStroke="#F8FAFC"
              borderStrokeWidth={1 / scale}
              anchorStroke="#F8FAFC"
              anchorFill="#7C3AED"
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
