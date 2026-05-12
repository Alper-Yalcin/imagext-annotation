import React, { useRef, useEffect } from 'react';
import { Image as ImageType } from '../../types/project';

interface ThumbnailStripProps {
  images: ImageType[];
  currentIndex: number;
  onSelect: (index: number) => void;
  // If true, it indicates that the image has annotations
  isAnnotated: (img: ImageType) => boolean;
}

export function ThumbnailStrip({ images, currentIndex, onSelect, isAnnotated }: ThumbnailStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[currentIndex] as HTMLElement;
      if (activeElement) {
        const scrollLeft = activeElement.offsetLeft - scrollRef.current.offsetWidth / 2 + activeElement.offsetWidth / 2;
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  return (
    <div className="h-[90px] min-h-[90px] bg-[#0B0F14] border-t border-white/10 flex items-center px-4 shrink-0">
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto h-full items-center no-scrollbar w-full"
      >
        {images.map((img, index) => {
          const active = currentIndex === index;
          const annotated = isAnnotated(img);
          
          return (
            <button
              key={img.id}
              onClick={() => onSelect(index)}
              className={`relative shrink-0 w-[100px] h-[64px] rounded-lg overflow-hidden group border-2 transition-all ${
                active ? 'border-[#7C3AED] shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'border-transparent hover:border-white/20'
              }`}
            >
              <img 
                src={img.url} 
                alt={img.name} 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
              <div className="absolute top-1 right-1">
                {annotated && (
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black/50 shadow-sm" />
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-1 py-0.5 text-center truncate">
                {index + 1}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
