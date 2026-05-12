import { ClassLabel } from "../../types/project";
import { Tag } from "lucide-react";

interface ClassListProps {
  classes: ClassLabel[];
}

// Generate deterministic colors based on class name
function getColorForClass(name: string): string {
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500",
    "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-blue-500",
    "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
    "bg-pink-500", "bg-rose-500"
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function ClassList({ classes }: ClassListProps) {
  if (!classes || classes.length === 0) {
    return (
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6 flex flex-col items-center justify-center text-center">
        <Tag className="w-8 h-8 text-zinc-600 mb-3" />
        <h4 className="text-zinc-300 font-medium font-semibold">No classes found</h4>
        <p className="text-zinc-500 text-sm mt-1">This project does not have any classes configured.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-5">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-zinc-400" />
        Classes <span className="text-zinc-500 text-sm font-normal">({classes.length})</span>
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {classes.map((cls) => (
          <div 
            key={cls.id}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg"
          >
            <div className={`w-3 h-3 rounded-full ${getColorForClass(cls.name)}`}></div>
            <span className="text-sm font-medium text-zinc-200">{cls.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
