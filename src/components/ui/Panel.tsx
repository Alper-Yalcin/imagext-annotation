import React, { ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
}

export function Panel({ title, children, headerRight, className = "" }: PanelProps) {
  return (
    <div className={`flex flex-col bg-[#0B0F14] border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#05070A]/50 shrink-0">
          {typeof title === 'string' ? (
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          ) : (
            title
          )}
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
