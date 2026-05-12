import { ButtonHTMLAttributes, ReactNode } from "react";

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label?: string;
  shortcut?: string;
  active?: boolean;
  tone?: "default" | "danger";
}

export function ToolbarButton({
  icon,
  label,
  shortcut,
  active,
  tone = "default",
  className = "",
  ...props
}: ToolbarButtonProps) {
  const activeStyles =
    tone === "danger"
      ? "bg-rose-500/15 text-rose-200 border-rose-400/35"
      : "bg-violet-500/18 text-white border-violet-400/50 shadow-lg shadow-violet-950/30";
  const idleStyles =
    tone === "danger"
      ? "text-rose-300/80 hover:text-rose-100 hover:bg-rose-500/10 border-transparent"
      : "text-slate-400 hover:text-white hover:bg-white/7 border-transparent";

  return (
    <button
      type="button"
      title={shortcut ? `${label || props["aria-label"] || "Tool"} (${shortcut})` : label}
      className={`group inline-flex min-w-9 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? activeStyles : idleStyles
      } ${className}`}
      {...props}
    >
      <span className="shrink-0">{icon}</span>
      {label && <span className="hidden xl:inline">{label}</span>}
      {shortcut && (
        <span className="hidden 2xl:inline rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-slate-400 group-hover:text-slate-200">
          {shortcut}
        </span>
      )}
    </button>
  );
}
