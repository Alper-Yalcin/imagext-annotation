import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  tone?: "violet" | "blue" | "emerald" | "amber" | "rose";
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  className = "",
  tone = "violet",
}: StatCardProps) {
  const tones = {
    violet: { glow: "bg-violet-500/15", text: "text-violet-300" },
    blue: { glow: "bg-blue-500/15", text: "text-blue-300" },
    emerald: { glow: "bg-emerald-500/15", text: "text-emerald-300" },
    amber: { glow: "bg-amber-500/15", text: "text-amber-300" },
    rose: { glow: "bg-rose-500/15", text: "text-rose-300" },
  };
  const palette = tones[tone];

  return (
    <div className={`studio-surface rounded-xl p-5 flex flex-col relative overflow-hidden ${className}`}>
      <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl ${palette.glow}`} />
      <div className="relative flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {icon && (
          <div className={`rounded-lg border border-white/10 bg-white/5 p-2 ${palette.text}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="relative flex items-baseline gap-2 mt-auto">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? "text-emerald-400" : "text-rose-400"}`}>
            {trendUp ? "up" : "down"} {trend}
          </span>
        )}
      </div>
    </div>
  );
}
