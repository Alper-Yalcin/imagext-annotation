import React, { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "classification" | "detection" | "labeled" | "unlabeled" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const variants = {
    classification: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    detection: "bg-[#7C3AED]/10 text-[#8B5CF6] border-[#7C3AED]/20",
    labeled: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    unlabeled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    neutral: "bg-white/5 text-slate-300 border-white/10",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
