import { FolderOpen, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";

export function EmptyProjects() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No projects yet"
      description="Create your first annotation project, upload your dataset, and start labeling right in your browser."
      action={
        <Link to="/projects/new">
          <Button variant="primary" className="bg-yellow-500 hover:bg-yellow-400 text-zinc-900 border-transparent">
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </Link>
      }
    />
  );
}
