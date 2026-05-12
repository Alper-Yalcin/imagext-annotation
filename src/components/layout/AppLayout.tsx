import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isAnnotationRoute = /\/projects\/[^/]+\/annotate$/.test(location.pathname);

  if (isAnnotationRoute) {
    return <div className="min-h-screen bg-app-bg text-slate-100 antialiased">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-app-bg text-slate-100 antialiased">
      <Sidebar />
      <main className="ml-[264px] flex min-h-screen w-[calc(100%-264px)] flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
