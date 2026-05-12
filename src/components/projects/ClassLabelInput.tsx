import { useState } from "react";
import type { KeyboardEvent } from "react";
import { ClassLabel } from "../../types/project";
import { Plus, X } from "lucide-react";

interface ClassLabelInputProps {
  labels: ClassLabel[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function ClassLabelInput({ labels, onAdd, onRemove }: ClassLabelInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onAdd(trimmed);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. cat, car, person"
          className="flex-1 bg-[#05070A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-white px-5 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add
        </button>
      </div>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 bg-[#05070A]/50 border border-white/5 rounded-xl">
          {labels.map((label) => (
            <div
              key={label.id}
              className="group flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-1.5 rounded-lg"
            >
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div>
              <span className="text-sm font-medium text-slate-200">{label.name}</span>
              <button
                type="button"
                onClick={() => onRemove(label.id)}
                className="text-slate-400 hover:text-rose-400 transition-colors ml-1"
                title="Remove class"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {labels.length === 0 && (
        <div className="text-sm text-slate-500 py-4 bg-[#05070A]/30 border border-dashed border-white/10 rounded-xl flex items-center justify-center">
          No classes added yet. Add at least one class to continue.
        </div>
      )}
    </div>
  );
}
