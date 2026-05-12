import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#0B0F14]/50 border border-white/5 rounded-2xl w-full h-full min-h-[240px]">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-[280px] mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
