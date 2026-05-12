import { ProjectType } from "../../types/project";
import { Tag, Focus } from "lucide-react";

interface ProjectTypeSelectorProps {
  value: ProjectType;
  onChange: (type: ProjectType) => void;
}

export function ProjectTypeSelector({ value, onChange }: ProjectTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange("classification")}
        className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
          value === "classification"
            ? "bg-[#7C3AED]/10 border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.15)]"
            : "bg-[#05070A] border-white/5 hover:border-white/20"
        }`}
      >
        <div className={`p-2 rounded-lg shrink-0 ${value === "classification" ? "bg-[#7C3AED]/20 text-[#8B5CF6]" : "bg-white/5 text-slate-400"}`}>
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-semibold ${value === "classification" ? "text-slate-100" : "text-slate-300"}`}>Classification</h3>
          <p className="text-xs text-slate-500 mt-1">Assign one class label to each image.</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange("detection")}
        className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
          value === "detection"
            ? "bg-[#7C3AED]/10 border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.15)]"
            : "bg-[#05070A] border-white/5 hover:border-white/20"
        }`}
      >
        <div className={`p-2 rounded-lg shrink-0 ${value === "detection" ? "bg-[#7C3AED]/20 text-[#8B5CF6]" : "bg-white/5 text-slate-400"}`}>
          <Focus className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-semibold ${value === "detection" ? "text-slate-100" : "text-slate-300"}`}>YOLO Detection</h3>
          <p className="text-xs text-slate-500 mt-1">Draw bounding boxes and assign labels to objects.</p>
        </div>
      </button>
    </div>
  );
}
