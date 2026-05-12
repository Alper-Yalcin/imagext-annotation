import React from 'react';
import { Project } from "../../types/project";
import { Tag, Focus, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { IconButton } from "../ui/IconButton";

interface ProjectCardProps {
  project: Project & { totalImages: number; labeledImages: number };
  onDelete?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const navigate = useNavigate();
  const isClassification = project.type === "classification";
  const progress = project.totalImages > 0 ? Math.round((project.labeledImages / project.totalImages) * 100) : 0;
  
  const handleOpen = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div 
      onClick={handleOpen}
      className="group bg-[#0B0F14] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/20 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden h-full"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED] opacity-0 group-hover:opacity-[0.03] blur-3xl rounded-full transition-opacity pointer-events-none" />

      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <Badge variant={isClassification ? "classification" : "detection"} className="mb-2">
            {isClassification ? <Tag className="w-3 h-3 mr-1" /> : <Focus className="w-3 h-3 mr-1" />}
            {isClassification ? 'Classification' : 'Detection'}
          </Badge>
          <h3 className="text-lg font-semibold text-slate-100 group-hover:text-[#8B5CF6] transition-colors line-clamp-1">{project.name}</h3>
          <p className="text-xs text-slate-500">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <IconButton 
          icon={<Trash2 className="w-4 h-4" />} 
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 z-10 relative"
          tooltip="Delete project"
        />
      </div>

      <div className="mt-auto pt-2 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {project.classes.slice(0, 3).map(c => (
            <span key={c.id} className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-xs font-medium text-slate-300">
              {c.name}
            </span>
          ))}
          {project.classes.length > 3 && (
            <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-xs font-medium text-slate-400">
              +{project.classes.length - 3} more
            </span>
          )}
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Progress</span>
            <span className="text-slate-300 font-semibold">{project.labeledImages} / {project.totalImages}</span>
          </div>
          <ProgressBar progress={progress} height="sm" />
          <div className="text-right text-[11px] text-[#8B5CF6] font-medium mt-1">
            {progress}% complete
          </div>
        </div>
      </div>
    </div>
  );
}
