import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSolarProjects } from "@/hooks/useSolarProjects";
import { SolarProject } from "@/types/solarProject";
import { AdvancedCalculatorProjectService, type AdvancedCalculatorProject } from "@/services/advancedCalculatorProjectService";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/utils/calculations";
import { motion } from "framer-motion";
import { Sun, Plus, Calculator, BarChart3, FileText, Settings, LogOut, Home, Zap, Trash2, Eye, Sparkles, Brain, Cpu, User, CreditCard, ChevronDown, BatteryCharging, Clock } from "lucide-react";
import NoticeBoard from "@/components/dashboard/NoticeBoard";
import { AICreditBalance } from "@/components/ai-credits/AICreditBalance";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { projects, loadProjects, deleteProject } = useSolarProjects();
  const navigate = useNavigate();
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [advancedProjects, setAdvancedProjects] = useState<AdvancedCalculatorProject[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        await loadProjects();
        
        // Load advanced calculator projects
        if (user) {
          const result = await AdvancedCalculatorProjectService.getUserProjects(user.id);
          if (result.success && result.projects) {
            setAdvancedProjects(result.projects);
          }
        }
      } catch (error) {
        console.error("Error loading projects:", error);
        toast.error("Failed to load your projects.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [loadProjects, user]);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    // Navigate to Advanced Calculator
    navigate("/advanced-calculator");
    
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

  const handleDeleteAdvancedProject = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        if (!user) return;
        const result = await AdvancedCalculatorProjectService.deleteProject(projectId, user.id);
        if (result.success) {
          setAdvancedProjects(prev => prev.filter(p => p.id !== projectId));
          toast.success("Project deleted successfully");
        } else {
          toast.error(result.error || "Failed to delete project");
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("Failed to delete project");
      }
    }
  };

  const handleViewAdvancedProject = (projectId: string) => {
    navigate(`/advanced-calculator?projectId=${projectId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isAdmin = user?.email === "amrit.mandal0191@gmail.com";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-[1900px]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm -mx-4 px-4 py-4 mb-8 border-b">
        {/* Single Row: Logo on Left, Menu Items + User Profile on Right */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <img src="/baess-logo.PNG" alt="BAESS Labs" className="h-12 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          
          {/* Right: Menu Items + User Account Dropdown */}
          <div className="flex gap-3 flex-wrap items-center">
            {/* AI Credit Balance */}
            <AICreditBalance compact={true} />
            
            <Link to="/">
              <Button variant="outline" className="flex gap-2">
                <Home className="h-4 w-4" />
                Return to Home
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
                  <DialogTitle>Create New Solar Project</DialogTitle>
                  <DialogDescription>
                    Start a new solar PV system design with the Advanced Calculator. Your project will be auto-saved as you work.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input 
                    id="project-name" 
                    value={newProjectName} 
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., 100kW Rooftop Commercial - ABC Industries"
                    className="mt-2"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll be able to set the project name again in the Location tab.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateProject}>
                    <Zap className="h-4 w-4 mr-2" />
                    Start Advanced Calculator
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* User Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 h-9 px-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{user?.name || 'User'}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user?.name || 'User'}</span>
                    <span className="text-xs text-gray-500 font-normal">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/account')} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account')} className="cursor-pointer">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscription & Billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account')} className="cursor-pointer">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Credit Usage
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex gap-6">
        {/* Projects Section - Main Content */}
        <div className="flex-1 min-w-0">
          {/* AI Tools Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI-Powered Tools</h2>
                <p className="text-sm text-muted-foreground">
                  Advanced artificial intelligence tools for solar PV design and analysis
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* PV AI Designer Pro Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setIsNewProjectDialogOpen(true)}
              >
                <Card className="h-full border-2 border-transparent hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden">
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 bg-cover bg-center bg-no-repeat"
                    style={{ 
                      backgroundImage: "url('/pv-designer-bg.jpg.png')",
                      opacity: 0.4
                    }}
                  ></div>
                  
                  {/* Glass Morphism Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-[1px]"></div>
                  
                  <CardHeader className="relative z-10 pb-4 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                        <Brain className="h-8 w-8" />
                      </div>
                      <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1">
                        AI Powered
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                      PV AI Designer Pro
                    </CardTitle>
                    <CardDescription className="text-sm mt-2 text-gray-700 font-medium">
                      Comprehensive solar PV system design with AI-powered BOQ generation, detailed engineering calculations, and intelligent feasibility analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 bg-white/70 backdrop-blur-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-800 font-medium">AI-Driven Design Optimization</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span className="text-gray-800 font-medium">Automated BOQ Generation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-800 font-medium">Smart Feasibility Reports</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="relative z-10 bg-white/80 backdrop-blur-md">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                      <Zap className="h-4 w-4 mr-2" />
                      Start New Project
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* AI BOQ Generator Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="opacity-75"
              >
                <Card className="h-full border-2 border-gray-300 shadow-lg relative overflow-hidden">
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 bg-cover bg-center bg-no-repeat"
                    style={{ 
                      backgroundImage: "url('/boq-generator-bg.jpg.png')",
                      opacity: 0.4
                    }}
                  ></div>
                  
                  {/* Glass Morphism Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-[1px]"></div>
                  
                  <CardHeader className="relative z-10 pb-4 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                        <FileText className="h-8 w-8" />
                      </div>
                      <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-3 py-1">
                        Coming Soon
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                      AI BOQ Generator
                    </CardTitle>
                    <CardDescription className="text-sm mt-2 text-gray-700 font-medium">
                      Intelligent Bill of Quantities generation using advanced AI algorithms for accurate cost estimation and material planning
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 bg-white/70 backdrop-blur-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <span className="text-gray-800 font-medium">AI-Powered Cost Analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-teal-600" />
                        <span className="text-gray-800 font-medium">Smart Material Estimation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-cyan-600" />
                        <span className="text-gray-800 font-medium">Automated Documentation</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="relative z-10 bg-white/80 backdrop-blur-md">
                    <Button 
                      disabled 
                      className="w-full bg-gray-400 text-white cursor-not-allowed opacity-60"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Coming Soon
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* BESS Designer Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => navigate('/bess-designer')}
              >
                <Card className="h-full border-2 border-transparent hover:border-yellow-400 transition-all duration-300 shadow-lg hover:shadow-2xl relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 opacity-60"></div>
                  
                  {/* Glass Morphism Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 backdrop-blur-[1px]"></div>
                  
                  <CardHeader className="relative z-10 pb-4 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg">
                        <BatteryCharging className="h-8 w-8" />
                      </div>
                      <Badge className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-xs px-3 py-1">
                        Beta
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent font-bold">
                      BESS Designer
                    </CardTitle>
                    <CardDescription className="text-sm mt-2 text-gray-700 font-medium">
                      Comprehensive Battery Energy Storage System design tool with load analysis, sizing calculations, and financial modeling
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10 bg-white/70 backdrop-blur-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                        <span className="text-gray-800 font-medium">Battery System Sizing</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                        <span className="text-gray-800 font-medium">Load Profile Analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-800 font-medium">Financial Modeling & ROI</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="relative z-10 bg-white/80 backdrop-blur-md">
                    <Button className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white shadow-md">
                      <BatteryCharging className="h-4 w-4 mr-2" />
                      Design BESS System
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Section Separator */}
          <div className="relative mb-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Your Projects
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solar"></div>
            </div>
          ) : advancedProjects.length === 0 && projects.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center py-12">
            <Sun className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first solar project with the Advanced Calculator to start designing systems and analyzing financial performance.
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
        <>
          {/* AI Designer Pro - Saved Projects */}
          {advancedProjects.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Designer Pro - Saved Projects</h2>
                  <p className="text-sm text-muted-foreground">
                    AI-powered solar PV designs with intelligent BOQ generation and smart feasibility analysis
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {advancedProjects.map((project, index) => {
                  const systemCapacity = project.system_params?.capacity || 'N/A';
                  const location = project.location?.address || project.location?.city || 'Unknown Location';
                  const irr = project.financial_results?.irr;
                  const npv = project.financial_results?.npv;
                  const progress = project.progress_percentage || 0;
                  const statusColor = project.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300';
                  
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                        <CardHeader className="pb-1.5 pt-3 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="line-clamp-2 text-lg leading-tight font-bold">{project.project_name}</CardTitle>
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColor} whitespace-nowrap`}>
                              {project.status === 'completed' ? 'Completed' : 'Draft'}
                            </span>
                          </div>
                          <CardDescription className="text-xs mt-0.5">
                            Updated {formatDate(project.updated_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow py-2 px-4">
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground">Location:</span>
                              <p className="text-sm line-clamp-1 font-medium">{location}</p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground">System Capacity:</span>
                              <p className="text-sm font-medium">{typeof systemCapacity === 'number' ? `${systemCapacity.toFixed(2)} kW` : systemCapacity}</p>
                            </div>
                            {irr && npv && (
                              <div className="flex justify-between">
                                <div>
                                  <span className="text-xs font-semibold text-muted-foreground">IRR:</span>
                                  <p className="text-sm font-bold text-emerald-600">{irr.toFixed(2)}%</p>
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-muted-foreground">NPV:</span>
                                  <p className="text-sm font-bold text-blue-600">{formatCurrency(npv)}</p>
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="flex justify-between mb-0.5">
                                <span className="text-xs font-semibold text-muted-foreground">Progress:</span>
                                <span className="text-xs font-bold">{progress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-1.5 pb-2.5 px-4 flex justify-between gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteAdvancedProject(project.id)}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 h-8 px-3"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleViewAdvancedProject(project.id)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex-1 h-8 text-sm font-medium"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            {project.status === 'completed' ? 'View' : 'Continue'}
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Old Calculator Projects (Legacy) */}
          {projects.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-md">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Legacy Projects</h2>
                  <p className="text-sm text-muted-foreground">
                    Projects created with the basic calculator
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="h-full flex flex-col hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-1.5 pt-3 px-4">
                        <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
                        <CardDescription className="text-[10px] mt-0.5">Created on {formatDate(project.createdAt)}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow py-2 px-4">
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground">Client:</span>
                            <p className="text-xs">{project.clientName}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground">System Size:</span>
                            <p className="text-xs">{project.systemSize} kW</p>
                          </div>
                          <div className="flex justify-between">
                            <div>
                              <span className="text-[10px] font-medium text-muted-foreground">IRR:</span>
                              <p className="text-xs">{formatNumber(project.irr)}%</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium text-muted-foreground">NPV:</span>
                              <p className="text-xs">{formatCurrency(project.netPresentValue)}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-muted-foreground">Payback Period:</span>
                            <p className="text-xs">{project.paybackPeriod.years} years, {project.paybackPeriod.months} months</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-1.5 pb-2.5 px-4 flex justify-between gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="h-7 text-xs px-2"
                        >
                          Delete
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="bg-solar hover:bg-solar-dark text-white h-7 text-xs"
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
        </div>

        {/* Notice Board Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <NoticeBoard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
