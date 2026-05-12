import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { AnnotationPage } from "./pages/AnnotationPage";

import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Router>
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects/new" element={<CreateProjectPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/projects/:projectId/annotate" element={<AnnotationPage />} />
            </Routes>
          </AppShell>
        </Router>
      </ConfirmProvider>
    </ToastProvider>
  );
}
