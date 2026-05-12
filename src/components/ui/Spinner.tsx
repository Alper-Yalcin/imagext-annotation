import React from "react";
import { Loader2 } from "lucide-react";

export function Spinner({ className = "w-6 h-6", text }: { className?: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`animate-spin text-zinc-400 ${className}`} />
      {text && <span className="text-sm text-zinc-400">{text}</span>}
    </div>
  );
}
