import { ReactNode } from "react";

interface TopBarProps {
  breadcrumbs: ReactNode;
  actions?: ReactNode;
}

export function TopBar({ breadcrumbs, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-700/40 bg-app-bg/72 px-6 backdrop-blur-2xl">
      <div className="flex items-center text-sm">
        {breadcrumbs}
      </div>
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </header>
  );
}
