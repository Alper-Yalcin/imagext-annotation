import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
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
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-[#7C3AED] hover:bg-[#8B5CF6] text-white shadow shadow-[#7C3AED]/20",
      secondary: "bg-[#111827] border border-white/10 hover:border-white/20 text-white shadow-sm",
      danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-transparent hover:border-rose-500/50",
      ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5 border border-transparent",
      success: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-transparent hover:border-emerald-500/50",
    };
    
    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
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
