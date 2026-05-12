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
            ? "bg-violet-500/10 border-violet-400/70 shadow-[0_0_18px_rgba(124,58,237,0.16)]"
            : "bg-slate-950/50 border-white/10 hover:border-white/20"
        }`}
      >
        <div className={`p-2 rounded-lg shrink-0 ${value === "classification" ? "bg-violet-500/20 text-violet-200" : "bg-white/5 text-slate-400"}`}>
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
            ? "bg-violet-500/10 border-violet-400/70 shadow-[0_0_18px_rgba(124,58,237,0.16)]"
            : "bg-slate-950/50 border-white/10 hover:border-white/20"
        }`}
      >
        <div className={`p-2 rounded-lg shrink-0 ${value === "detection" ? "bg-violet-500/20 text-violet-200" : "bg-white/5 text-slate-400"}`}>
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
