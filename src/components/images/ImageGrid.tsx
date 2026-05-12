import { CheckCircle2, Circle, Image as ImageIcon, Trash2 } from "lucide-react";
import { ImageItem } from "../../types/image";
import { Badge } from "../ui/Badge";

interface ImageGridProps {
  images: ImageItem[];
  onDeleteImage?: (imageId: string) => void;
}

export function ImageGrid({ images, onDeleteImage }: ImageGridProps) {
  if (!images || images.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/30 p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500">
          <ImageIcon className="h-7 w-7" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">No images uploaded yet</h3>
        <p className="text-sm text-slate-500">Upload images to start annotating.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {images.map((image) => {
        const labeled = image.status === "labeled";
        return (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] transition-all hover:border-violet-400/35 hover:bg-white/[0.055]"
          >
            <div className="absolute left-2 top-2 z-10">
              <Badge variant={labeled ? "labeled" : "unlabeled"}>
                {labeled ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                {labeled ? "Labeled" : "Unlabeled"}
              </Badge>
            </div>

            {onDeleteImage && (
              <button
                type="button"
                onClick={() => onDeleteImage(image.id)}
                className="absolute right-2 top-2 z-10 rounded-lg border border-white/10 bg-slate-950/80 p-1.5 text-slate-400 opacity-0 backdrop-blur-sm transition-all hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                title="Delete image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <div className="aspect-square bg-slate-950">
              <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            </div>

            <div className="p-3">
              <h4 className="truncate text-sm font-semibold text-white" title={image.relativePath || image.name}>
                {image.name}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {image.width}x{image.height} px
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
