import React, { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, className = "" }: StatCardProps) {
  return (
    <div className={`bg-[#0B0F14] border border-white/10 rounded-2xl p-5 flex flex-col relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
