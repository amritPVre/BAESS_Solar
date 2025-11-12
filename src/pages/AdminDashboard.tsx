import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Edit, Plus, Users, Database, BarChart3, Shield, Coins, Bell } from "lucide-react";
import { SolarPanel, SolarInverter } from "@/services/solarComponentsService";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { AdminCreditAllocation } from "@/components/ai-credits/AdminCreditAllocation";
import { AdminNoticeManager } from "@/components/dashboard/AdminNoticeManager";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [panels, setPanels] = useState<SolarPanel[]>([]);
  const [inverters, setInverters] = useState<SolarInverter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPanels: 0,
    totalInverters: 0,
    totalProjects: 0
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user, navigate]);

  const checkAdminStatus = async () => {
    if (!user?.id) {
      toast.error("Please log in to continue");
      navigate("/auth");
      return;
    }

    try {
      // Check if user is super admin from database
      const { data, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!data?.is_super_admin) {
        toast.error("Access denied: Admin privileges required");
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadData();
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Failed to verify admin access");
      navigate("/dashboard");
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
        
      if (usersError) throw usersError;
      setUsers(usersData || []);
      
      // Load panels
      const { data: panelsData, error: panelsError } = await supabase
        .from('solar_panels')
        .select('*');
        
      if (panelsError) throw panelsError;
      setPanels(panelsData || []);
      
      // Load inverters
      const { data: invertersData, error: invertersError } = await supabase
        .from('solar_inverters')
        .select('*');
        
      if (invertersError) throw invertersError;
      setInverters(invertersData || []);
      
      // Load projects count
      const { count: projectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
        
      if (projectsError) throw projectsError;
      
      // Update stats
      setStats({
        totalUsers: usersData?.length || 0,
        totalPanels: panelsData?.length || 0,
        totalInverters: invertersData?.length || 0,
        totalProjects: projectsCount || 0
      });
      
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const deletePanel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('solar_panels')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Panel deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting panel:", error);
      toast.error("Failed to delete panel");
    }
  };

  const deleteInverter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('solar_inverters')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Inverter deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting inverter:", error);
      toast.error("Failed to delete inverter");
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | BAESS Labs</title>
      </Helmet>
      <Header />
      
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, solar components, and system settings</p>
          </div>
          <Button onClick={loadData} disabled={loading}>
            {loading ? "Loading..." : "Refresh Data"}
          </Button>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Users className="mr-2 h-5 w-5 text-solar" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Database className="mr-2 h-5 w-5 text-solar" />
                Solar Panels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPanels}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Database className="mr-2 h-5 w-5 text-solar" />
                Inverters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalInverters}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-solar" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProjects}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="panels" className="flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Solar Panels
            </TabsTrigger>
            <TabsTrigger value="inverters" className="flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Inverters
            </TabsTrigger>
            <TabsTrigger value="ai-credits" className="flex items-center">
              <Coins className="mr-2 h-4 w-4" />
              AI Credits
            </TabsTrigger>
            <TabsTrigger value="notices" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Notices
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.company || "-"}</TableCell>
                          <TableCell>{user.phone || "-"}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Solar Panels Tab */}
          <TabsContent value="panels">
            <Card>
              <CardHeader className="flex justify-between items-start">
                <div>
                  <CardTitle>Solar Panels</CardTitle>
                  <CardDescription>View and manage solar panel data</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Power (W)</TableHead>
                        <TableHead>Technology</TableHead>
                        <TableHead>Efficiency</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {panels.map((panel) => (
                        <TableRow key={panel.id}>
                          <TableCell className="font-medium">{panel.manufacturer}</TableCell>
                          <TableCell>{panel.model}</TableCell>
                          <TableCell>{panel.nominal_power_w}</TableCell>
                          <TableCell>{panel.technology}</TableCell>
                          <TableCell>{panel.efficiency_percent ? `${panel.efficiency_percent}%` : "-"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => deletePanel(panel.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {panels.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No panels found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Inverters Tab */}
          <TabsContent value="inverters">
            <Card>
              <CardHeader className="flex justify-between items-start">
                <div>
                  <CardTitle>Solar Inverters</CardTitle>
                  <CardDescription>View and manage solar inverter data</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Power (kW)</TableHead>
                        <TableHead>Phase</TableHead>
                        <TableHead>Topology</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inverters.map((inverter) => (
                        <TableRow key={inverter.id}>
                          <TableCell className="font-medium">{inverter.manufacturer}</TableCell>
                          <TableCell>{inverter.model}</TableCell>
                          <TableCell>{inverter.nominal_ac_power_kw}</TableCell>
                          <TableCell>{inverter.phase}</TableCell>
                          <TableCell>{inverter.topology || "-"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => deleteInverter(inverter.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {inverters.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No inverters found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* AI Credits Tab */}
          <TabsContent value="ai-credits">
            <AdminCreditAllocation />
          </TabsContent>
          
          {/* Notices Tab */}
          <TabsContent value="notices">
            <AdminNoticeManager />
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>View system performance and usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Data Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Total Users:</dt>
                          <dd className="font-medium">{stats.totalUsers}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Total Panels:</dt>
                          <dd className="font-medium">{stats.totalPanels}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Total Inverters:</dt>
                          <dd className="font-medium">{stats.totalInverters}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Total Projects:</dt>
                          <dd className="font-medium">{stats.totalProjects}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">System Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Database Status:</dt>
                          <dd className="font-medium text-green-500">Online</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">API Status:</dt>
                          <dd className="font-medium text-green-500">Operational</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Last Backup:</dt>
                          <dd className="font-medium">{new Date().toLocaleDateString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">System Version:</dt>
                          <dd className="font-medium">1.0.0</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminDashboard;
