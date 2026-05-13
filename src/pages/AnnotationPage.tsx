import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project } from "../types/project";
import { getProjectById } from "../storage/projectStorage";
import { ImageMeta } from "../types/image";
import { getImageMetasByProjectId } from "../storage/imageStorage";
import { ClassificationAnnotator } from "../components/annotation/ClassificationAnnotator";
import { YoloAnnotator } from "../components/annotation/YoloAnnotator";
import { ArrowLeft } from "lucide-react";

export function AnnotationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (projectId) {
        const p = getProjectById(projectId);
        if (p) {
          setProject(p);
          setImages(await getImageMetasByProjectId(p.id));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
        <button 
          onClick={() => navigate("/projects")}
          className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">No images found</h2>
        <p className="text-zinc-400 mb-6">Upload images first to start annotating.</p>
        <button 
          onClick={() => navigate(`/projects/${project.id}`)}
          className="theme-on-accent inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Project
        </button>
      </div>
    );
  }

  if (project.type === "classification") {
    return <ClassificationAnnotator project={project} initialImages={images} />;
  }

  return <YoloAnnotator project={project} initialImages={images} />;
}
