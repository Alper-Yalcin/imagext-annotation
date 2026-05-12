import React, { ReactNode } from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  isActive?: boolean;
  tooltip?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, isActive, tooltip, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        title={tooltip}
        className={`p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
          isActive 
            ? "bg-[#7C3AED] text-white shadow-sm" 
            : "text-slate-400 hover:text-white hover:bg-white/10"
        } ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
