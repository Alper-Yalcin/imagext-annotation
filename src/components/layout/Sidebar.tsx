import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Database,
  FolderKanban,
  LayoutDashboard,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Projeler", path: "/projects", icon: FolderKanban },
  { name: "Ayarlar", path: "/settings", icon: Settings, disabled: true },
];

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[264px] shrink-0 flex-col border-r border-slate-700/40 bg-slate-950/70 backdrop-blur-2xl">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg shadow-violet-950/30">
          <Database className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight text-white">ImageXT</h1>
          <p className="text-xs font-medium text-slate-400">Annotation Studio</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const isActive =
            !item.disabled &&
            (item.path === "/"
              ? location.pathname === "/"
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
          const content = (
            <span
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? "border border-violet-400/20 bg-violet-500/15 text-white shadow-lg shadow-violet-950/20"
                  : item.disabled
                    ? "cursor-not-allowed text-slate-600"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-violet-300" : ""}`} />
              {item.name}
            </span>
          );

          return item.disabled ? (
            <div key={item.name}>{content}</div>
          ) : (
            <Link key={item.name} to={item.path}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-700/40 p-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="mb-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-white/5 hover:text-slate-100"
          aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
        >
          {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isLight ? "Aydinlik" : "Karanlik"}
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-200">Kullanici</p>
            <p className="truncate text-xs text-slate-500">Yerel Calisma</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
}
