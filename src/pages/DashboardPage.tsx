import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FolderKanban, Image as ImageIcon, Layers, Plus, Target } from "lucide-react";
import { Project } from "../types/project";
import { getProjects } from "../storage/projectStorage";
import { getImageMetasByProjectId } from "../storage/imageStorage";
import { TopBar } from "../components/layout/TopBar";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { StatCard } from "../components/ui/StatCard";
import { Button } from "../components/ui/Button";
import { ProjectRow } from "../components/projects/ProjectRow";
import { EmptyProjects } from "../components/projects/EmptyProjects";

type EnrichedProject = Project & { totalImages: number; labeledImages: number };

export function DashboardPage() {
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const storedProjects = getProjects();
    const enrichedProjects = await Promise.all(
      storedProjects.map(async (project) => {
        const images = await getImageMetasByProjectId(project.id);
        return {
          ...project,
          totalImages: images.length,
          labeledImages: images.filter((image) => image.status === "labeled").length,
        };
      }),
    );
    setProjects(enrichedProjects);
  };

  const recentProjects = useMemo(
    () => [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [projects],
  );

  const totalProjects = projects.length;
  const totalImages = projects.reduce((acc, project) => acc + project.totalImages, 0);
  const totalLabeled = projects.reduce((acc, project) => acc + project.labeledImages, 0);
  const projectTypes = new Set(projects.map((project) => project.type)).size;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        breadcrumbs={<Breadcrumbs items={[{ label: "Dashboard" }]} />}
        actions={
          <Button variant="primary" onClick={() => navigate("/projects/new")} leftIcon={<Plus className="h-4 w-4" />}>
            Yeni Proje
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-8 p-8">
          <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-violet-300">ImageXT Annotation Studio</p>
              <h1 className="text-3xl font-bold tracking-tight text-white">Hos geldin</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Dataset durumunu, annotation ilerlemesini ve son projelerini tek bakista takip et.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate("/projects")} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Tum projeleri gor
            </Button>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Toplam Proje" value={totalProjects} icon={<FolderKanban className="h-5 w-5" />} tone="violet" />
            <StatCard title="Toplam Gorsel" value={totalImages.toLocaleString()} icon={<ImageIcon className="h-5 w-5" />} tone="blue" />
            <StatCard title="Toplam Annotation" value={totalLabeled.toLocaleString()} icon={<Target className="h-5 w-5" />} tone="emerald" />
            <StatCard title="Proje Turu" value={projectTypes} icon={<Layers className="h-5 w-5" />} tone="amber" />
          </section>

          <section className="studio-surface rounded-xl p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Son Projeler</h2>
                <p className="mt-1 text-sm text-slate-500">En son olusturulan veya eklenen projeler</p>
              </div>
              {projects.length > 0 && (
                <Button variant="secondary" onClick={() => navigate("/projects")} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Projeler
                </Button>
              )}
            </div>

            {projects.length === 0 ? (
              <EmptyProjects />
            ) : (
              <div className="space-y-2">
                {recentProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
