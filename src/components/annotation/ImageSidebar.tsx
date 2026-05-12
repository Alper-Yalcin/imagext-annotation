import { CheckCircle2, Circle, Filter, Images } from "lucide-react";
import { ImageItem } from "../../types/image";
import { Badge } from "../ui/Badge";

interface ImageSidebarProps {
  images: ImageItem[];
  currentImageId: string;
  onSelectImage: (imageId: string) => void;
}

export function ImageSidebar({ images, currentImageId, onSelectImage }: ImageSidebarProps) {
  const labeled = images.filter((img) => img.status === "labeled").length;

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-slate-700/40 bg-slate-950/55 backdrop-blur-xl">
      <div className="border-b border-slate-700/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Images className="h-4 w-4 text-slate-400" />
            Gorseller
            <span className="font-medium text-slate-500">({images.length})</span>
          </h3>
          <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200">
            <Filter className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Badge variant="labeled">{labeled} labeled</Badge>
          <Badge variant="unlabeled">{images.length - labeled} left</Badge>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {images.map((img, index) => {
          const isActive = img.id === currentImageId;
          const isLabeled = img.status === "labeled";

          return (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelectImage(img.id)}
              className={`grid w-full grid-cols-[64px_1fr_auto] items-center gap-3 rounded-xl border p-2 text-left transition-all ${
                isActive
                  ? "border-violet-400/50 bg-violet-500/15 shadow-lg shadow-violet-950/20"
                  : "border-transparent bg-white/[0.025] hover:border-slate-600/70 hover:bg-white/[0.05]"
              }`}
            >
              <div className="h-12 w-16 overflow-hidden rounded-lg border border-white/10 bg-slate-900">
                <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-100" title={img.relativePath || img.name}>
                  {img.name}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  #{String(index + 1).padStart(3, "0")} · {img.width}x{img.height}
                </p>
              </div>
              {isLabeled ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 text-amber-300" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
