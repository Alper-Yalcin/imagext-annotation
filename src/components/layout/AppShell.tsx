import { ReactNode } from "react";
import { AppLayout } from "./AppLayout";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return <AppLayout>{children}</AppLayout>;
}
