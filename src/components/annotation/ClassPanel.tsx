import { FormEvent, useState } from "react";
import { Check, Plus, Tag, Trash2, X } from "lucide-react";
import { ClassLabel } from "../../types/project";
import { getClassColor } from "../../utils/classColor";

interface ClassPanelProps {
  classes: ClassLabel[];
  selectedClassId?: string;
  onSelectClass: (classId: string) => void;
  onAddClass?: (className: string) => boolean | void;
  onDeleteClass?: (classId: string) => void;
  className?: string;
  compact?: boolean;
}

export function ClassPanel({
  classes,
  selectedClassId,
  onSelectClass,
  onAddClass,
  onDeleteClass,
  className: panelClassName = "",
  compact = false,
}: ClassPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = newClassName.trim();

    if (!trimmedName) {
      setError("Sinif adi gerekli.");
      return;
    }

    if (classes.some(cls => cls.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError("Bu sinif zaten var.");
      return;
    }

    const result = onAddClass?.(trimmedName);
    if (result === false) return;

    setNewClassName("");
    setError(null);
    setIsAdding(false);
  };

  const cancelAdd = () => {
    setNewClassName("");
    setError(null);
    setIsAdding(false);
  };

  return (
    <div className={`flex h-full flex-col ${panelClassName || "w-80 border-l border-slate-700/40 bg-slate-950/55"}`}>
      <div className="flex items-center justify-between border-b border-slate-700/40 px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Tag className="h-4 w-4 text-slate-400" />
            Siniflar
            <span className="font-medium text-slate-500">({classes.length})</span>
          </h3>
          {!compact && <p className="mt-1 text-xs text-slate-500">Sinif sec veya 1-9 kisayollarini kullan.</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            setError(null);
          }}
          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white"
          title="Sinif ekle"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {isAdding && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-violet-400/35 bg-violet-500/10 p-2">
            <input
              autoFocus
              value={newClassName}
              onChange={(event) => {
                setNewClassName(event.target.value);
                setError(null);
              }}
              placeholder="Yeni sinif adi"
              className="studio-input px-3 py-2 text-sm"
            />
            {error && <p className="mt-2 text-xs font-medium text-rose-300">{error}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelAdd}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white"
                title="Vazgec"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className="rounded-lg border border-emerald-400/25 bg-emerald-500/15 p-2 text-emerald-200 hover:bg-emerald-500/25"
                title="Kaydet"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {classes.length === 0 && !isAdding && (
          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 p-4 text-sm text-slate-500">
            Henuz sinif yok. Etiketlemeye baslamak icin sinif ekle.
          </div>
        )}

        {classes.map((cls, index) => {
          const isSelected = cls.id === selectedClassId;
          const shortcut = index + 1;
          const color = cls.color || getClassColor(cls.name, index);

          return (
            <div
              key={cls.id}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                isSelected
                  ? "border-violet-400/50 bg-violet-500/15 text-white shadow-lg shadow-violet-950/20"
                  : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-slate-500/70 hover:bg-white/[0.06]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectClass(cls.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate text-sm font-semibold">{cls.name}</span>
              </button>

              {shortcut <= 9 && (
                <kbd className="rounded-md border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                  {shortcut}
                </kbd>
              )}

              {onDeleteClass && (
                <button
                  type="button"
                  onClick={() => onDeleteClass(cls.id)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                  title="Sinifi sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
