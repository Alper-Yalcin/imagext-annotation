import React, { ReactNode } from "react";

interface PanelProps {
  title?: ReactNode;
  children: ReactNode;
  headerRight?: ReactNode;
  className?: string;
}

export function Panel({ title, children, headerRight, className = "" }: PanelProps) {
  return (
    <div className={`studio-surface flex flex-col rounded-xl overflow-hidden ${className}`}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 bg-slate-950/30 shrink-0">
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
