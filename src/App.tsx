import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { AnnotationPage } from "./pages/AnnotationPage";

import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppLayout } from "./components/layout/AppLayout";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<CreateProjectPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/projects/:projectId/annotate" element={<AnnotationPage />} />
              </Routes>
            </AppLayout>
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
