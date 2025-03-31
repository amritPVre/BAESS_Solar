import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSolarProjects } from "@/hooks/useSolarProjects";
import { SolarProject } from "@/types/solarProject";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import { motion } from "framer-motion";
import { Sun, Plus, Calculator, BarChart3, FileText, Settings } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, loadProjects, deleteProject } = useSolarProjects();
  const navigate = useNavigate();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        await loadProjects();
      } catch (error) {
        console.error("Error loading projects:", error);
        toast.error("Failed to load your projects.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [loadProjects]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    navigate("/solar-calculator", { 
      state: { newProjectName } 
    });
    
    setIsNewProjectDialogOpen(false);
    setNewProjectName("");
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(projectId);
        toast.success("Project deleted successfully");
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("Failed to delete project");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isAdmin = user?.email === "admin@example.com";

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || "User"}</h1>
          <p className="text-muted-foreground">
            Manage your solar projects and financial analyses
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-4 flex-wrap">
          <Link to="/solar-calculator">
            <Button variant="outline" className="flex gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </Button>
          </Link>
          
          <Link to="/boq-generator">
            <Button variant="outline" className="flex gap-2">
              <FileText className="h-4 w-4" />
              BOQ Generator
            </Button>
          </Link>
          
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" className="flex gap-2">
                <Settings className="h-4 w-4" />
                Admin Dashboard
              </Button>
            </Link>
          )}
          
          <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-solar hover:bg-solar-dark text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Give your solar project a name to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="project-name">Project Name</Label>
                <Input 
                  id="project-name" 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Residential Solar - John Smith"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solar"></div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <Sun className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first solar project to start analyzing financial performance and return on investment.
            </p>
            <Button 
              onClick={() => setIsNewProjectDialogOpen(true)}
              className="bg-solar hover:bg-solar-dark text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>Created on {formatDate(project.createdAt)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Client:</span>
                      <p>{project.clientName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">System Size:</span>
                      <p>{project.systemSize} kW</p>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">IRR:</span>
                        <p>{formatNumber(project.irr)}%</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">NPV:</span>
                        <p>{formatCurrency(project.netPresentValue)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Payback Period:</span>
                      <p>{project.paybackPeriod.years} years, {project.paybackPeriod.months} months</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 flex justify-between">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    Delete
                  </Button>
                  <Button 
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="bg-solar hover:bg-solar-dark text-white"
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
