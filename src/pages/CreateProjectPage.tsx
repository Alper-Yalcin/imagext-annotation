import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectType } from "../types/project";
import { ProjectTypeSelector } from "../components/projects/ProjectTypeSelector";
import { createId } from "../utils/id";
import { addProject } from "../storage/projectStorage";
import { TopBar } from "../components/layout/TopBar";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Button } from "../components/ui/Button";

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("classification");

  const isFormValid = name.trim().length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newProject = {
      id: createId("proj"),
      name: name.trim(),
      type,
      classes: [],
      totalImages: 0,
      labeledImages: 0,
      createdAt: new Date().toISOString(),
    };

    addProject(newProject);
    navigate("/projects");
  };

  const handleCancel = () => {
    navigate("/projects");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar 
        breadcrumbs={<Breadcrumbs items={[{ label: "Projeler", path: "/projects" }, { label: "New Project" }]} />}
      />

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto px-6 py-10">
          
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-violet-300">Yeni dataset</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">Create Workspace</h2>
            <p className="text-slate-400 mt-2">Configure project metadata and annotation type.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="studio-surface rounded-xl p-8">
              
              <div className="max-w-3xl space-y-8">
                <div className="space-y-3">
                  <label htmlFor="projectName" className="block text-sm font-semibold text-slate-300">
                    Project Name <span className="text-[#8B5CF6]">*</span>
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Drone Vehicles"
                    className="studio-input px-4 py-3"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-300">
                    Annotation Type <span className="text-[#8B5CF6]">*</span>
                  </label>
                  <ProjectTypeSelector value={type} onChange={setType} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!isFormValid}>
                Create Workspace
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
