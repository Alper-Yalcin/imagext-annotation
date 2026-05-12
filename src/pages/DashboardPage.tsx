import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FolderKanban, Image as ImageIcon, Target, Layers } from "lucide-react";
import { Project } from "../types/project";
import { getProjects, deleteProject } from "../storage/projectStorage";
import { getImagesByProjectId, deleteImagesByProjectId } from "../storage/imageStorage";
import { deleteClassificationAnnotationsByProjectId, deleteDetectionAnnotationsByProjectId } from "../storage/annotationStorage";
import { ProjectCard } from "../components/projects/ProjectCard";
import { EmptyProjects } from "../components/projects/EmptyProjects";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { TopBar } from "../components/layout/TopBar";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { StatCard } from "../components/ui/StatCard";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const [projects, setProjects] = useState<(Project & { totalImages: number; labeledImages: number })[]>([]);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const storedProjects = getProjects();
    const enrichedProjects = await Promise.all(storedProjects.map(async p => {
      const images = await getImagesByProjectId(p.id);
      return {
        ...p,
        totalImages: images.length,
        labeledImages: images.filter(img => img.status === "labeled").length
      };
    }));
    setProjects(enrichedProjects);
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: "Delete Project",
      message: `Are you sure you want to delete the project "${name}"? This action cannot be undone and will delete all associated images and annotations.`,
      confirmLabel: "Delete Project",
      variant: "danger"
    });

    if (isConfirmed) {
      deleteClassificationAnnotationsByProjectId(id);
      deleteDetectionAnnotationsByProjectId(id);
      deleteProject(id);
      await deleteImagesByProjectId(id);
      await loadProjects();
      showToast({ type: "success", title: "Project deleted", message: `Project "${name}" was successfully deleted.` });
    }
  };

  const totalProjects = projects.length;
  const totalImages = projects.reduce((acc, p) => acc + p.totalImages, 0);
  const totalLabeled = projects.reduce((acc, p) => acc + p.labeledImages, 0);
  const overallProgress = totalImages > 0 ? Math.round((totalLabeled / totalImages) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar 
        breadcrumbs={<Breadcrumbs items={[{ label: "Overview" }]} />}
        actions={
          <Button variant="primary" onClick={() => navigate("/projects/new")} leftIcon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        }
      />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          
          {projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Projects" 
                value={totalProjects} 
                icon={<FolderKanban className="w-5 h-5" />} 
              />
              <StatCard 
                title="Total Images" 
                value={totalImages} 
                icon={<ImageIcon className="w-5 h-5" />} 
              />
              <StatCard 
                title="Annotated Images" 
                value={totalLabeled} 
                icon={<Target className="w-5 h-5" />} 
              />
              <StatCard 
                title="Average Progress" 
                value={`${overallProgress}%`} 
                icon={<Layers className="w-5 h-5" />} 
                trend={overallProgress > 0 ? "Active" : undefined}
                trendUp={overallProgress > 0}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white tracking-tight">Your Projects</h2>
            </div>

            {projects.length === 0 ? (
              <EmptyProjects />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onDelete={() => handleDelete(project.id, project.name)} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
