import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div 
      className={`bg-[#0B0F14] border border-white/10 rounded-2xl overflow-hidden transition-all ${
        onClick ? "cursor-pointer hover:border-white/20 hover:shadow-lg" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
