import { Box, ChevronDown, Eye, Lock, Trash2 } from "lucide-react";
import { DetectionAnnotation } from "../../types/annotation";
import { ClassLabel } from "../../types/project";
import { getClassColor } from "../../utils/classColor";

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
  onChangeBoxClass,
}: DetectionAnnotationListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-700/40 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Box className="h-4 w-4 text-slate-400" />
          Annotation'lar
          <span className="font-medium text-slate-500">({boxes.length})</span>
        </h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {boxes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 p-5 text-center text-sm text-slate-500">
            Sinif secip gorsel uzerine kutu ciz.
          </div>
        ) : (
          boxes.map((box, index) => {
            const isSelected = box.id === selectedBoxId;
            const currentClass = classes.find((c) => c.id === box.classId);
            const color = currentClass?.color || getClassColor(currentClass?.name || "box", index);

            return (
              <div
                key={box.id}
                role="button"
                tabIndex={0}
                className={`rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-violet-400/55 bg-violet-500/15 shadow-lg shadow-violet-950/20"
                    : "border-white/10 bg-white/[0.035] hover:border-slate-500/70 hover:bg-white/[0.06]"
                }`}
                onClick={() => onSelectBox(box.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelectBox(box.id);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 shrink-0 rounded-full border border-white/10 bg-slate-950 text-center text-xs font-bold leading-6 text-slate-300">
                    {index + 1}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <div className="relative min-w-0 flex-1">
                    <select
                      value={box.classId}
                      onChange={(event) => {
                        event.stopPropagation();
                        onChangeBoxClass(box.id, event.target.value);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="w-full appearance-none rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 pr-7 text-xs font-semibold text-white outline-none focus:border-violet-400/70"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  </div>
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteBox(box.id);
                    }}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                    title="Delete box"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1 text-center font-mono text-[10px] text-slate-500">
                  <span>x {Math.round(box.x)}</span>
                  <span>y {Math.round(box.y)}</span>
                  <span>w {Math.round(box.width)}</span>
                  <span>h {Math.round(box.height)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
