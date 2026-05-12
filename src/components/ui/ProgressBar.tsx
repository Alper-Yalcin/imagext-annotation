import React from "react";

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  height?: "sm" | "md" | "lg";
}

export function ProgressBar({ progress, className = "", height = "sm" }: ProgressBarProps) {
  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full bg-[#111827] border border-white/5 rounded-full overflow-hidden ${heights[height]} ${className}`}>
      <div 
        className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] h-full transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(124,58,237,0.3)]"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}
