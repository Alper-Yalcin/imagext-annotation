import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  toast: {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  };
  onDismiss: () => void;
}

const iconMap = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const borderMap = {
  success: "border-emerald-500/20",
  error: "border-red-500/20",
  warning: "border-yellow-500/20",
  info: "border-blue-500/20",
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for exit animation
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 bg-zinc-900 border ${
        borderMap[toast.type]
      } p-4 rounded-xl shadow-lg transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="shrink-0 pt-0.5">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs text-zinc-400 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-zinc-500 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
