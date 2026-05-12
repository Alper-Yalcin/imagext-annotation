import React, { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "classification" | "detection" | "labeled" | "unlabeled" | "neutral" | "default" | "warning" | "danger" | "success";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const variants = {
    classification: "bg-blue-500/10 text-blue-300 border-blue-400/20",
    detection: "bg-violet-500/10 text-violet-300 border-violet-400/20",
    labeled: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
    unlabeled: "bg-amber-500/10 text-amber-300 border-amber-400/20",
    warning: "bg-amber-500/10 text-amber-300 border-amber-400/20",
    danger: "bg-rose-500/10 text-rose-300 border-rose-400/20",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
    neutral: "bg-white/5 text-slate-300 border-white/10",
    default: "bg-white/5 text-slate-300 border-white/10",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
