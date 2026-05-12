import { ProjectType } from "../../types/project";
import { Image, CheckCircle, Circle, Activity } from "lucide-react";

interface ProjectStatsProps {
  totalImages: number;
  labeledImages: number;
}

export function ProjectStats({ totalImages, labeledImages }: ProjectStatsProps) {
  const unlabeledImages = totalImages - labeledImages;
  const progress = totalImages > 0 ? Math.round((labeledImages / totalImages) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5">
        <div className="flex items-center gap-3 text-zinc-400 mb-2">
          <Image className="w-5 h-5 text-blue-400" />
          <h4 className="font-medium">Total Images</h4>
        </div>
        <p className="text-3xl font-bold text-white">{totalImages}</p>
      </div>
      
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5">
        <div className="flex items-center gap-3 text-zinc-400 mb-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h4 className="font-medium">Labeled</h4>
        </div>
        <p className="text-3xl font-bold text-white">{labeledImages}</p>
      </div>
      
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5">
        <div className="flex items-center gap-3 text-zinc-400 mb-2">
          <Circle className="w-5 h-5 text-yellow-400" />
          <h4 className="font-medium">Unlabeled</h4>
        </div>
        <p className="text-3xl font-bold text-white">{unlabeledImages}</p>
      </div>
      
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5">
        <div className="flex items-center gap-3 text-zinc-400 mb-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h4 className="font-medium">Progress</h4>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-white">{progress}%</p>
        </div>
        <div className="w-full bg-zinc-900 rounded-full h-1.5 mt-3 overflow-hidden">
          <div 
            className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
