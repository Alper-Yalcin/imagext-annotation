import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectType, ClassLabel } from "../types/project";
import { ProjectTypeSelector } from "../components/projects/ProjectTypeSelector";
import { ClassLabelInput } from "../components/projects/ClassLabelInput";
import { createId } from "../utils/id";
import { addProject } from "../storage/projectStorage";
import { TopBar } from "../components/layout/TopBar";
import { Breadcrumbs } from "../components/layout/Breadcrumbs";
import { Button } from "../components/ui/Button";

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("classification");
  const [classes, setClasses] = useState<ClassLabel[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddClass = (className: string) => {
    setError(null);
    if (classes.some(c => c.name.toLowerCase() === className.toLowerCase())) {
      setError(`Class "${className}" already exists.`);
      return;
    }
    
    setClasses([...classes, { id: createId("class"), name: className }]);
  };

  const handleRemoveClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    setError(null);
  };

  const isFormValid = name.trim().length > 0 && classes.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const newProject = {
      id: createId("proj"),
      name: name.trim(),
      type,
      classes,
      totalImages: 0,
      labeledImages: 0,
      createdAt: new Date().toISOString(),
    };

    addProject(newProject);
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05070A]">
      <TopBar 
        breadcrumbs={<Breadcrumbs items={[{ label: "Overview", path: "/" }, { label: "New Project" }]} />}
      />

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto px-6 py-12">
          
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white tracking-tight">Create Workspace</h2>
            <p className="text-slate-400 mt-2">Configure your annotation project settings and classes.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-[#0B0F14] rounded-2xl border border-white/10 p-8 shadow-xl shadow-black/20">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  {/* Project Name */}
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
                      className="w-full bg-[#05070A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
                    />
                  </div>

                  {/* Project Type */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-300">
                      Annotation Type <span className="text-[#8B5CF6]">*</span>
                    </label>
                    <ProjectTypeSelector value={type} onChange={setType} />
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Class Labels */}
                  <label className="block text-sm font-semibold text-slate-300">
                    Target Classes <span className="text-[#8B5CF6]">*</span>
                  </label>
                  <ClassLabelInput 
                    labels={classes} 
                    onAdd={handleAddClass} 
                    onRemove={handleRemoveClass} 
                  />
                  {error && (
                    <p className="text-rose-400 text-sm mt-2">{error}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">Press enter to add multiple classes quickly. You can also edit these later.</p>
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
