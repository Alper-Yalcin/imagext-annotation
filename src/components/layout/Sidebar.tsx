import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, HardDrive, User, Database, ChevronRight, Settings } from "lucide-react";
import { ProgressBar } from "../ui/ProgressBar";
import { useEffect, useState } from "react";
import { getProjectById } from "../../storage/projectStorage";
import { Project } from "../../types/project";

export function Sidebar() {
  const location = useLocation();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Extract project ID from URL if present
  useEffect(() => {
    const match = location.pathname.match(/\/projects\/([a-zA-Z0-9_-]+)/);
    if (match && match[1] !== 'new') {
      const p = getProjectById(match[1]);
      setActiveProject(p || null);
    } else {
      setActiveProject(null);
    }
  }, [location.pathname]);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "New Project", path: "/projects/new", icon: FolderKanban },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#070A0F]/95 backdrop-blur-md border-r border-white/10 flex flex-col shrink-0 z-50">
      {/* Logo & Branding */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center shrink-0 shadow-lg shadow-[#7C3AED]/20">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-none tracking-tight">ImageXT</h1>
          <p className="text-[#8B5CF6] text-[10px] font-semibold tracking-wider uppercase mt-1">Annotation Studio</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="px-4 flex flex-col gap-1 mb-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/projects') && item.name === 'Projects');
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#7C3AED]/10 text-[#8B5CF6] shadow-[inset_2px_0_0_0_#7C3AED]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-[#8B5CF6]" : "text-slate-500"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Active Project Context */}
      {activeProject && (
        <div className="px-4 mb-4 flex-1">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Current Workspace</h4>
          <div className="bg-[#0B0F14] border border-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-slate-200 line-clamp-1">{activeProject.name}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-4 text-[10px]">
              <span className={`px-1.5 py-0.5 rounded-sm font-semibold ${
                activeProject.type === 'classification' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {activeProject.type === 'classification' ? 'Classify' : 'Detect'}
              </span>
            </div>
            
            <div className="space-y-1">
              {[
                { name: 'Overview', path: `/projects/${activeProject.id}` },
                { name: 'Annotation', path: `/projects/${activeProject.id}/annotate` },
              ].map(link => {
                const isLinkActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isLinkActive ? "bg-[#7C3AED]/20 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {link.name}
                    {isLinkActive && <ChevronRight className="w-3 h-3" />}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      {!activeProject && <div className="flex-1"></div>}

      {/* Lower Section */}
      <div className="p-4 space-y-4">
        {/* Storage Info */}
        <div className="bg-[#0B0F14] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Local Storage</h4>
          </div>
          <ProgressBar progress={15} height="sm" className="mb-2" />
          <p className="text-[10px] text-slate-500">IndexedDB Storage Limit Depends on Browser</p>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
          <div className="w-8 h-8 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Workspace User</p>
            <p className="text-[10px] text-slate-500 truncate">Local Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
