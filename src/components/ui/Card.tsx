import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div 
      className={`studio-surface rounded-xl overflow-hidden transition-all ${
        onClick ? "cursor-pointer hover:border-violet-400/30 hover:shadow-violet-950/20" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
