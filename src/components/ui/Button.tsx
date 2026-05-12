import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "soft";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "theme-on-accent bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white border border-white/10 shadow-lg shadow-violet-950/30",
      secondary: "bg-slate-900/80 border border-slate-700/70 hover:border-slate-500/80 hover:bg-slate-800/90 text-slate-100 shadow-sm",
      danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-400/50",
      ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent",
      success: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 hover:border-emerald-400/50",
      soft: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20",
    };
    
    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
      icon: "w-9 h-9 p-0",
    };

    const variantStyles = variants[variant];
    const sizeStyles = sizes[size];
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";
