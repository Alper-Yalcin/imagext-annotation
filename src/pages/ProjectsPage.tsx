import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Plus, Search } from "lucide-react";
import { Project } from "../types/project";
import { getProjects, deleteProject } from "../storage/projectStorage";
import { deleteImagesByProjectId, getImagesByProjectId } from "../storage/imageStorage";
import {
  deleteClassificationAnnotationsByProjectId,
  deleteDetectionAnnotationsByProjectId,
} from "../storage/annotationStorage";
import { TopBar } from "../components/layout/TopBar";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Button } from "../components/ui/Button";
import { ProjectRow } from "../components/projects/ProjectRow";
import { EmptyProjects } from "../components/projects/EmptyProjects";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";

type EnrichedProject = Project & { totalImages: number; labeledImages: number };
type SortMode = "updated" | "name" | "progress";

export function ProjectsPage() {
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updated");
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const storedProjects = getProjects();
    const enrichedProjects = await Promise.all(
      storedProjects.map(async (project) => {
        const images = await getImagesByProjectId(project.id);
        return {
          ...project,
          totalImages: images.length,
          labeledImages: images.filter((image) => image.status === "labeled").length,
        };
      }),
    );
    setProjects(enrichedProjects);
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: "Delete Project",
      message: `Are you sure you want to delete the project "${name}"? This action cannot be undone and will delete all associated images and annotations.`,
      confirmLabel: "Delete Project",
      variant: "danger",
    });

    if (!isConfirmed) return;

    deleteClassificationAnnotationsByProjectId(id);
    deleteDetectionAnnotationsByProjectId(id);
    deleteProject(id);
    await deleteImagesByProjectId(id);
    await loadProjects();
    showToast({ type: "success", title: "Project deleted", message: `Project "${name}" was successfully deleted.` });
  };

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? projects.filter((project) =>
          [project.name, project.type, ...project.classes.map((cls) => cls.name)]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : projects;

    return [...filtered].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "progress") {
        const aProgress = a.totalImages > 0 ? a.labeledImages / a.totalImages : 0;
        const bProgress = b.totalImages > 0 ? b.labeledImages / b.totalImages : 0;
        return bProgress - aProgress;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [projects, query, sortMode]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        breadcrumbs={<Breadcrumbs items={[{ label: "Projeler" }]} />}
        actions={
          <Button variant="primary" onClick={() => navigate("/projects/new")} leftIcon={<Plus className="h-4 w-4" />}>
            Yeni Proje
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6 p-8">
          <section>
            <p className="mb-2 text-sm font-semibold text-violet-300">Proje yonetimi</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">Projeler</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Tum annotation projelerini ara, sirala, ac veya sil.
            </p>
          </section>

          <section className="studio-surface rounded-xl p-5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Tum Projeler</h2>
                <p className="mt-1 text-sm text-slate-500">{visibleProjects.length} proje listeleniyor</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block min-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Proje ara..."
                    className="studio-input px-9 py-2.5 text-sm"
                  />
                </label>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="studio-input min-w-[180px] px-3 py-2.5 text-sm"
                >
                  <option value="updated">Son eklenen</option>
                  <option value="name">Ada gore</option>
                  <option value="progress">Ilerlemeye gore</option>
                </select>
              </div>
            </div>

            {projects.length === 0 ? (
              <EmptyProjects />
            ) : visibleProjects.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 text-center">
                <Database className="mb-3 h-10 w-10 text-slate-600" />
                <h3 className="font-semibold text-white">Eslesen proje yok</h3>
                <p className="mt-1 text-sm text-slate-500">Arama metnini degistirerek tekrar dene.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onDelete={() => handleDelete(project.id, project.name)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
