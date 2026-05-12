import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#05070A] text-slate-100 font-sans antialiased">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-[280px] flex min-h-screen flex-1 flex-col w-[calc(100%-280px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
