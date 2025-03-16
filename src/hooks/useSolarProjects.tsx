
import { useState, useCallback, useContext, createContext, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { SolarProject } from "@/types/solarProject";

interface SolarProjectsContextType {
  projects: SolarProject[];
  loading: boolean;
  error: string | null;
  loadProjects: () => Promise<void>;
  getProject: (id: string) => Promise<SolarProject>;
  saveProject: (project: Omit<SolarProject, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<SolarProject>;
  updateProject: (project: SolarProject) => Promise<SolarProject>;
  deleteProject: (id: string) => Promise<void>;
}

const SolarProjectsContext = createContext<SolarProjectsContextType | null>(null);

export const SolarProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SolarProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch projects from a server
      // For this demo, we'll use localStorage
      const projectsJson = localStorage.getItem("solar_app_projects") || "[]";
      const allProjects = JSON.parse(projectsJson);
      
      // Filter projects for the current user
      const userProjects = allProjects.filter((project: SolarProject) => project.userId === user.id);
      setProjects(userProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getProject = useCallback(async (id: string): Promise<SolarProject> => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const projectsJson = localStorage.getItem("solar_app_projects") || "[]";
      const allProjects = JSON.parse(projectsJson);
      
      const project = allProjects.find(
        (p: SolarProject) => p.id === id && p.userId === user.id
      );
      
      if (!project) {
        throw new Error("Project not found");
      }
      
      return project;
    } catch (error) {
      console.error("Failed to get project:", error);
      throw error;
    }
  }, [user]);

  const saveProject = useCallback(async (projectData: Omit<SolarProject, "id" | "userId" | "createdAt" | "updatedAt">): Promise<SolarProject> => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const projectsJson = localStorage.getItem("solar_app_projects") || "[]";
      const allProjects = JSON.parse(projectsJson);
      
      const newProject: SolarProject = {
        id: `project_${Date.now()}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...projectData,
      };
      
      allProjects.push(newProject);
      localStorage.setItem("solar_app_projects", JSON.stringify(allProjects));
      
      setProjects((prevProjects) => [...prevProjects, newProject]);
      
      return newProject;
    } catch (error) {
      console.error("Failed to save project:", error);
      throw error;
    }
  }, [user]);

  const updateProject = useCallback(async (projectData: SolarProject): Promise<SolarProject> => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const projectsJson = localStorage.getItem("solar_app_projects") || "[]";
      const allProjects = JSON.parse(projectsJson);
      
      const projectIndex = allProjects.findIndex(
        (p: SolarProject) => p.id === projectData.id && p.userId === user.id
      );
      
      if (projectIndex === -1) {
        throw new Error("Project not found");
      }
      
      const updatedProject = {
        ...projectData,
        updatedAt: new Date().toISOString(),
      };
      
      allProjects[projectIndex] = updatedProject;
      localStorage.setItem("solar_app_projects", JSON.stringify(allProjects));
      
      setProjects((prevProjects) => 
        prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      );
      
      return updatedProject;
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  }, [user]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    try {
      const projectsJson = localStorage.getItem("solar_app_projects") || "[]";
      const allProjects = JSON.parse(projectsJson);
      
      const filteredProjects = allProjects.filter(
        (p: SolarProject) => !(p.id === id && p.userId === user.id)
      );
      
      localStorage.setItem("solar_app_projects", JSON.stringify(filteredProjects));
      
      setProjects((prevProjects) => prevProjects.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  }, [user]);

  return (
    <SolarProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        loadProjects,
        getProject,
        saveProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </SolarProjectsContext.Provider>
  );
};

export const useSolarProjects = () => {
  const context = useContext(SolarProjectsContext);
  
  if (!context) {
    throw new Error("useSolarProjects must be used within a SolarProjectsProvider");
  }
  
  return context;
};
