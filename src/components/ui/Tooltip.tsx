import React, { ReactNode, useState } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  shortcut?: string;
}

export function Tooltip({ content, children, position = "top", shortcut }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${positions[position]} px-2.5 py-1.5 bg-zinc-800 text-zinc-100 text-xs font-medium rounded-lg whitespace-nowrap shadow-xl border border-zinc-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150`}>
          {content}
          {shortcut && (
            <span className="ml-2 px-1.5 py-0.5 bg-zinc-950 text-zinc-400 rounded font-sans text-[10px] tracking-widest border border-zinc-700">
              {shortcut}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
