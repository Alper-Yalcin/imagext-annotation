import { ClassLabel } from "../../types/project";
import { Tag } from "lucide-react";

interface ClassPanelProps {
  classes: ClassLabel[];
  selectedClassId?: string;
  onSelectClass: (classId: string) => void;
}

export function ClassPanel({ classes, selectedClassId, onSelectClass }: ClassPanelProps) {
  return (
    <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Tag className="w-4 h-4 text-zinc-400" />
          Classes
        </h3>
        <p className="text-xs text-zinc-500 mt-1">Select a class or use keyboard shortcuts (1, 2, ...)</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {classes.map((cls, index) => {
          const isSelected = cls.id === selectedClassId;
          const shortcut = index + 1;
          
          return (
            <button
              key={cls.id}
              onClick={() => onSelectClass(cls.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                isSelected 
                  ? "bg-yellow-500/10 border-yellow-500 text-yellow-500" 
                  : "bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-300"
              }`}
            >
              <span className="font-medium text-sm truncate">{cls.name}</span>
              {shortcut <= 9 && (
                <span className={`text-xs px-2 py-0.5 rounded border ${
                  isSelected 
                    ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-500" 
                    : "bg-zinc-700 border-zinc-600 text-zinc-400"
                }`}>
                  {shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
