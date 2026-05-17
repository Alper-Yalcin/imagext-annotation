import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Filter, Images, Loader2, Trash2, X } from "lucide-react";
import { ClassLabel } from "../../types/project";
import { ImageMeta } from "../../types/image";
import { getImageDataUrl } from "../../storage/imageStorage";
import { Badge } from "../ui/Badge";

interface ImageSidebarProps {
  images: ImageMeta[];
  currentImageId: string;
  classes: ClassLabel[];
  imageClassIdsByImageId?: Record<string, string[]>;
  onSelectImage: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
}

const ROW_HEIGHT = 76;
const OVERSCAN = 8;

export function ImageSidebar({
  images,
  currentImageId,
  classes,
  imageClassIdsByImageId = {},
  onSelectImage,
  onDeleteImage,
}: ImageSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    images.forEach((image, index) => map.set(image.id, index));
    return map;
  }, [images]);

  const filteredImages = useMemo(() => {
    if (!selectedClassId) return images;
    return images.filter((image) => imageClassIdsByImageId[image.id]?.includes(selectedClassId));
  }, [imageClassIdsByImageId, images, selectedClassId]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(filteredImages.length, startIndex + visibleCount);
  const visibleImages = filteredImages.slice(startIndex, endIndex);
  const selectedClass = classes.find((cls) => cls.id === selectedClassId);
  const labeled = filteredImages.filter((img) => img.status === "labeled").length;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateHeight = () => setViewportHeight(element.clientHeight);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setScrollTop(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [selectedClassId]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || viewportHeight === 0) return;

    const currentIndex = filteredImages.findIndex((image) => image.id === currentImageId);
    if (currentIndex === -1) return;

    const rowTop = currentIndex * ROW_HEIGHT;
    const centeredTop = rowTop - (viewportHeight - ROW_HEIGHT) / 2;
    const maxScrollTop = Math.max(0, filteredImages.length * ROW_HEIGHT - viewportHeight);
    const nextScrollTop = Math.max(0, Math.min(centeredTop, maxScrollTop));

    element.scrollTop = nextScrollTop;
    setScrollTop(nextScrollTop);
  }, [currentImageId, filteredImages, viewportHeight]);

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-slate-700/40 bg-slate-950/55 backdrop-blur-xl">
      <div className="border-b border-slate-700/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Images className="h-4 w-4 text-slate-400" />
            Gorseller
            <span className="font-medium text-slate-500">({images.length})</span>
          </h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen((value) => !value)}
              className={`rounded-lg p-1.5 hover:bg-white/5 hover:text-slate-200 ${
                selectedClassId ? "text-violet-200" : "text-slate-500"
              }`}
              title="Sinifa gore filtrele"
            >
              <Filter className="h-4 w-4" />
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-slate-700/70 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassId(undefined);
                    setIsFilterOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/7"
                >
                  Tum siniflar
                  {!selectedClassId && <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />}
                </button>
                <div className="my-1 h-px bg-slate-800" />
                <div className="max-h-72 overflow-y-auto">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setIsFilterOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/7"
                    >
                      <span className="min-w-0 truncate">{cls.name}</span>
                      {selectedClassId === cls.id && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-violet-300" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Badge variant="labeled">{labeled} labeled</Badge>
          <Badge variant="unlabeled">{filteredImages.length - labeled} left</Badge>
        </div>
        {selectedClass && (
          <button
            type="button"
            onClick={() => setSelectedClassId(undefined)}
            className="mt-3 flex max-w-full items-center gap-1.5 rounded-md border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-xs font-semibold text-violet-100"
            title="Filtreyi temizle"
          >
            <span className="truncate">{selectedClass.name}</span>
            <X className="h-3.5 w-3.5 shrink-0" />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {filteredImages.length > 0 ? (
          <div className="relative" style={{ height: filteredImages.length * ROW_HEIGHT }}>
            {visibleImages.map((img, relativeIndex) => {
              const index = startIndex + relativeIndex;
              const isActive = img.id === currentImageId;
              const isLabeled = img.status === "labeled";
              const displayIndex = (indexById.get(img.id) || 0) + 1;

              return (
                <div
                  key={img.id}
                  className={`absolute left-3 right-3 grid h-16 grid-cols-[64px_1fr_auto] items-center gap-3 rounded-xl border p-2 text-left transition-all ${
                    isActive
                      ? "border-violet-400/50 bg-violet-500/15 shadow-lg shadow-violet-950/20"
                      : "border-transparent bg-white/[0.025] hover:border-slate-600/70 hover:bg-white/[0.05]"
                  }`}
                  style={{ top: index * ROW_HEIGHT + 8 }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectImage(img.id)}
                    className="col-span-2 grid min-w-0 grid-cols-[64px_1fr] items-center gap-3 text-left"
                    title={img.relativePath || img.name}
                  >
                    <LazyThumbnail imageId={img.id} alt={img.name} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-100" title={img.relativePath || img.name}>
                        {img.name}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        #{String(displayIndex).padStart(3, "0")} - {img.width}x{img.height}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    {isLabeled ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-amber-300" />
                    )}
                    {onDeleteImage && (
                      <button
                        type="button"
                        onClick={() => onDeleteImage(img.id)}
                        className="rounded-md p-1 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                        title="Gorseli sil"
                        aria-label={`${img.name} gorselini sil`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
            Bu filtreye uygun gorsel yok.
          </div>
        )}
      </div>
    </aside>
  );
}

function LazyThumbnail({ imageId, alt }: { imageId: string; alt: string }) {
  const [src, setSrc] = useState<string>();

  useEffect(() => {
    let isCancelled = false;

    setSrc(undefined);
    getImageDataUrl(imageId).then((dataUrl) => {
      if (!isCancelled) setSrc(dataUrl);
    });

    return () => {
      isCancelled = true;
    };
  }, [imageId]);

  return (
    <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-900">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
      )}
    </div>
  );
}
