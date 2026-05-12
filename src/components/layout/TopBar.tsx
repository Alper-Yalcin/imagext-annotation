import { ReactNode } from "react";

interface TopBarProps {
  breadcrumbs: ReactNode;
  actions?: ReactNode;
}

export function TopBar({ breadcrumbs, actions }: TopBarProps) {
  return (
    <header className="h-16 shrink-0 bg-[#05070A]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center text-sm">
        {breadcrumbs}
      </div>
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </header>
  );
}
