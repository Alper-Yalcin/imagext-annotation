import {
  Hand,
  Maximize,
  MousePointer2,
  Redo2,
  RotateCcw,
  Square,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { ToolbarButton } from "../ui/ToolbarButton";

export type AnnotationToolMode = "draw" | "select" | "pan";

interface AnnotationToolbarProps {
  toolMode: AnnotationToolMode;
  scale: number;
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  onSetToolMode: (mode: AnnotationToolMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
}

export function AnnotationToolbar({
  toolMode,
  scale,
  canUndo,
  canRedo,
  canDelete,
  onSetToolMode,
  onZoomIn,
  onZoomOut,
  onFit,
  onUndo,
  onRedo,
  onDelete,
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-950/70 p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl">
      <ToolbarButton
        icon={<MousePointer2 className="h-4 w-4" />}
        label="Sec"
        shortcut="V"
        active={toolMode === "select"}
        onClick={() => onSetToolMode("select")}
      />
      <ToolbarButton
        icon={<Square className="h-4 w-4" />}
        label="Kutu Ciz"
        shortcut="W"
        active={toolMode === "draw"}
        onClick={() => onSetToolMode("draw")}
      />
      <ToolbarButton
        icon={<Hand className="h-4 w-4" />}
        label="Tasi"
        shortcut="H"
        active={toolMode === "pan"}
        onClick={() => onSetToolMode("pan")}
      />

      <span className="mx-1 h-6 w-px bg-slate-700/70" />

      <ToolbarButton icon={<ZoomIn className="h-4 w-4" />} label="Yakinlastir" shortcut="Z" onClick={onZoomIn} />
      <ToolbarButton icon={<ZoomOut className="h-4 w-4" />} label="Uzaklastir" shortcut="X" onClick={onZoomOut} />
      <div className="min-w-14 px-2 text-center font-mono text-xs font-semibold text-slate-300">
        {Math.round(scale * 100)}%
      </div>
      <ToolbarButton icon={<Maximize className="h-4 w-4" />} label="Sigdir" shortcut="F" onClick={onFit} />

      <span className="mx-1 h-6 w-px bg-slate-700/70" />

      <ToolbarButton icon={<Undo2 className="h-4 w-4" />} label="Geri Al" shortcut="Ctrl+Z" disabled={!canUndo} onClick={onUndo} />
      <ToolbarButton icon={<Redo2 className="h-4 w-4" />} label="Ileri Al" shortcut="Ctrl+Y" disabled={!canRedo} onClick={onRedo} />
      <ToolbarButton icon={<RotateCcw className="h-4 w-4" />} label="Fit" onClick={onFit} />
      <ToolbarButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Sil"
        shortcut="Del"
        tone="danger"
        disabled={!canDelete}
        onClick={onDelete}
      />
    </div>
  );
}
