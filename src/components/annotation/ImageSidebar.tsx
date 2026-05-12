import { ImageItem } from "../../types/image";
import { CheckCircle, Circle } from "lucide-react";

interface ImageSidebarProps {
  images: ImageItem[];
  currentImageId: string;
  onSelectImage: (imageId: string) => void;
}

export function ImageSidebar({ images, currentImageId, onSelectImage }: ImageSidebarProps) {
  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white">Images <span className="text-zinc-500 font-normal">({images.length})</span></h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {images.map((img, index) => {
          const isActive = img.id === currentImageId;
          return (
            <button
              key={img.id}
              onClick={() => onSelectImage(img.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                isActive ? "bg-zinc-800 text-white" : "hover:bg-zinc-800/50 text-zinc-400"
              }`}
            >
              <div className="relative w-10 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
                <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={img.relativePath || img.name}>
                  {img.name}
                </p>
                {img.relativePath && (
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5" title={img.relativePath}>
                    {img.relativePath.split('/').slice(0, -1).join('/')}/...
                  </p>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  {img.status === "labeled" ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <Circle className="w-3 h-3 text-yellow-400" />
                  )}
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${
                    img.status === "labeled" ? "text-green-400" : "text-yellow-400"
                  }`}>
                    {img.status}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
