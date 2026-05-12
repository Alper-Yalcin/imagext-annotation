import type { MouseEvent } from "react";
import { MoreHorizontal, Tag, Target, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Project } from "../../types/project";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";

interface ProjectRowProps {
  project: Project & { totalImages: number; labeledImages: number };
  onDelete?: () => void;
}

export function ProjectRow({ project, onDelete }: ProjectRowProps) {
  const navigate = useNavigate();
  const isClassification = project.type === "classification";
  const progress = project.totalImages > 0 ? Math.round((project.labeledImages / project.totalImages) * 100) : 0;

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation();
    onDelete?.();
  };

  return (
    <button
      type="button"
      onClick={() => navigate(`/projects/${project.id}`)}
      className="group grid w-full grid-cols-[minmax(0,1fr)_180px_112px_40px] items-center gap-4 rounded-xl border border-transparent bg-white/[0.035] px-4 py-3 text-left transition-all hover:border-violet-400/25 hover:bg-white/[0.06]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950">
          {isClassification ? (
            <Tag className="h-6 w-6 text-blue-300" />
          ) : (
            <Target className="h-6 w-6 text-violet-300" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-white group-hover:text-violet-200">{project.name}</h3>
            <Badge variant={isClassification ? "classification" : "detection"}>
              {isClassification ? "Classification" : "YOLO"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {project.totalImages.toLocaleString()} gorsel · {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <ProgressBar progress={progress} height="sm" />
      </div>

      <div className="text-right text-xs font-semibold text-slate-300">{progress}%</div>

      <div className="flex items-center justify-end">
        <span className="rounded-lg p-2 text-slate-500 transition-colors group-hover:bg-white/5 group-hover:text-slate-300">
          <MoreHorizontal className="h-4 w-4" />
        </span>
        {onDelete && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleDelete}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onDelete();
              }
            }}
            title="Delete project"
            className="ml-1 rounded-lg p-2 text-slate-500 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </span>
        )}
      </div>
    </button>
  );
}
