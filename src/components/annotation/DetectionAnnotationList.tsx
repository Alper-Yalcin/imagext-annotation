import { DetectionAnnotation } from "../../types/annotation";
import { ClassLabel } from "../../types/project";
import { Trash2, Box, ChevronDown } from "lucide-react";

interface DetectionAnnotationListProps {
  boxes: DetectionAnnotation[];
  classes: ClassLabel[];
  selectedBoxId?: string;
  onSelectBox: (boxId: string) => void;
  onDeleteBox: (boxId: string) => void;
  onChangeBoxClass: (boxId: string, classId: string) => void;
}

export function DetectionAnnotationList({ 
  boxes, 
  classes, 
  selectedBoxId, 
  onSelectBox, 
  onDeleteBox,
  onChangeBoxClass
}: DetectionAnnotationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800 shrink-0">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Box className="w-4 h-4 text-zinc-400" />
          Annotations <span className="text-zinc-500 font-normal">({boxes.length})</span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {boxes.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No boxes yet. Select a class and draw on the image.
          </div>
        ) : (
          boxes.map((box) => {
            const isSelected = box.id === selectedBoxId;
            const currentClass = classes.find(c => c.id === box.classId);
            
            return (
              <div
                key={box.id}
                className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                  isSelected 
                    ? "bg-zinc-800 border-yellow-500/50" 
                    : "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-500/50 hover:bg-zinc-800"
                }`}
                onClick={() => onSelectBox(box.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: currentClass?.color || "#eab308" }}
                    />
                    <div className="relative flex-1">
                      <select
                        value={box.classId}
                        onChange={(e) => {
                          e.stopPropagation();
                          onChangeBoxClass(box.id, e.target.value);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 text-xs text-white rounded px-2 py-1 appearance-none focus:outline-none focus:border-yellow-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBox(box.id);
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors ml-2 shrink-0"
                    title="Delete box"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="text-[10px] items-center gap-2 grid grid-cols-4 font-mono text-zinc-500 px-1 text-center">
                  <div title="X coordinate">x: {Math.round(box.x)}</div>
                  <div title="Y coordinate">y: {Math.round(box.y)}</div>
                  <div title="Width">w: {Math.round(box.width)}</div>
                  <div title="Height">h: {Math.round(box.height)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
