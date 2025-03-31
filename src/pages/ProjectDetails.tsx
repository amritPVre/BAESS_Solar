
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useSolarProjects } from "@/hooks/useSolarProjects";
import { toast } from "sonner";
import SolarCalculator from "@/components/SolarCalculator";
import { SolarProject } from "@/types/solarProject";
import { Home } from "lucide-react";

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { isAuthenticated } = useAuth();
  const { getProject, updateProject } = useSolarProjects();
  const navigate = useNavigate();
  const [project, setProject] = useState<SolarProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    async function loadProject() {
      if (projectId) {
        try {
          setLoading(true);
          const loadedProject = await getProject(projectId);
          setProject(loadedProject);
          setError(null);
        } catch (err) {
          setError("Failed to load project. It may have been deleted or you don't have access to it.");
          toast.error("Failed to load project");
        } finally {
          setLoading(false);
        }
      }
    }

    loadProject();
  }, [isAuthenticated, navigate, projectId, getProject]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-solar mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          <Link to="/">
            <Button variant="outline" className="flex gap-2">
              <Home className="h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <Alert className="mb-6">
          <AlertTitle>Project Not Found</AlertTitle>
          <AlertDescription>This project doesn't exist or you don't have access to it.</AlertDescription>
        </Alert>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          <Link to="/">
            <Button variant="outline" className="flex gap-2">
              <Home className="h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdate = async (updatedProject: SolarProject) => {
    try {
      await updateProject(updatedProject);
      toast.success("Project updated successfully!");
    } catch (err) {
      toast.error("Failed to update project");
    }
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          <Link to="/">
            <Button variant="outline" className="flex gap-2">
              <Home className="h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
      
      <SolarCalculator 
        projectData={project}
        onSaveProject={handleUpdate}
      />
    </div>
  );
};

export default ProjectDetails;
