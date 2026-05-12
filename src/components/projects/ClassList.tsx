import { ClassLabel } from "../../types/project";
import { Tag } from "lucide-react";
import { getClassColor } from "../../utils/classColor";

interface ClassListProps {
  classes: ClassLabel[];
  counts?: Record<string, number>;
}

export function ClassList({ classes, counts = {} }: ClassListProps) {
  if (!classes || classes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 p-6 text-center">
        <Tag className="mx-auto mb-3 h-8 w-8 text-slate-600" />
        <h4 className="font-semibold text-slate-300">No classes found</h4>
        <p className="mt-1 text-sm text-slate-500">This project does not have any classes configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {classes.map((cls, index) => {
        const color = cls.color || getClassColor(cls.name, index);
        return (
          <div
            key={cls.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate text-sm font-semibold text-slate-200">{cls.name}</span>
            </div>
            <span className="rounded-md bg-slate-950/70 px-2 py-0.5 text-xs font-semibold text-slate-400">
              {counts[cls.id] || 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}
