import { ImageItem } from "../../types/image";
import { Image as ImageIcon, Trash2, CheckCircle, Circle } from "lucide-react";

interface ImageGridProps {
  images: ImageItem[];
  onDeleteImage?: (imageId: string) => void;
}

export function ImageGrid({ images, onDeleteImage }: ImageGridProps) {
  if (!images || images.length === 0) {
    return (
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-800 border-dashed p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-500">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No images uploaded yet</h3>
        <p className="text-zinc-500 text-sm max-w-sm">
          Upload images to start annotating.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((image) => (
        <div 
          key={image.id}
          className="group bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden hover:border-yellow-500/50 transition-colors relative"
        >
          {/* Status Badge */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-zinc-900/80 backdrop-blur-sm rounded-md border border-zinc-700/50 shadow-sm">
            {image.status === "labeled" ? (
              <>
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Labeled</span>
              </>
            ) : (
              <>
                <Circle className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-medium text-yellow-400 uppercase tracking-wider">Unlabeled</span>
              </>
            )}
          </div>

          {/* Delete Button */}
          {onDeleteImage && (
            <button
              onClick={() => onDeleteImage(image.id)}
              className="absolute top-2 right-2 z-10 p-1.5 bg-zinc-900/80 backdrop-blur-sm text-zinc-400 hover:text-red-400 rounded-md border border-zinc-700/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Image Thumbnail */}
          <div className="aspect-square bg-zinc-900 relative overflow-hidden flex items-center justify-center">
            <img 
              src={image.dataUrl} 
              alt={image.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          </div>

          {/* Image Info */}
          <div className="p-3">
            <h4 className="text-sm font-medium text-white line-clamp-1 mb-1" title={image.relativePath || image.name}>
              {image.name}
            </h4>
            {image.relativePath && (
              <p className="text-[10px] text-zinc-500 truncate mb-1" title={image.relativePath}>
                {image.relativePath.split('/').slice(0, -1).join('/')}/...
              </p>
            )}
            <p className="text-xs text-zinc-500 mt-1">
              {image.width} × {image.height} px
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
