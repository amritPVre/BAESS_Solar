import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, FolderOpen, Tag, BarChart3, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BlogPostList } from '@/components/blog/admin/BlogPostList';
import { BlogCategoryManager } from '@/components/blog/admin/BlogCategoryManager';
import { BlogTagManager } from '@/components/blog/admin/BlogTagManager';
import { BlogAnalytics } from '@/components/blog/admin/BlogAnalytics';
import { Helmet } from 'react-helmet';

export const BlogAdmin = () => {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.log('❌ No auth user found:', authError);
        toast.error('You must be logged in to access the blog admin');
        navigate('/auth');
        return;
      }

      console.log('✅ Auth user found:', authUser.email);
      setUser(authUser);

      // Check if user is super admin or moderator
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_super_admin, user_role')
        .eq('id', authUser.id)
        .single();

      console.log('📊 Profile data:', { 
        profile, 
        profileError,
        is_super_admin: profile?.is_super_admin,
        user_role: profile?.user_role 
      });

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw profileError;
      }

      if (profile && (profile.is_super_admin || profile.user_role === 'moderator' || profile.user_role === 'admin')) {
        const roleLabel = profile.is_super_admin ? 'Super Admin' : (profile.user_role === 'admin' ? 'Admin' : 'Moderator');
        console.log('✅ Access granted! User is:', roleLabel);
        setHasAccess(true);
      } else {
        console.log('❌ Access denied. Profile:', profile);
        toast.error('You do not have permission to access the blog admin');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Error checking access:', error);
      toast.error('Error checking permissions: ' + error.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#0A2463] font-semibold">Loading Blog Admin...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Blog Admin | BAESS Labs</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
        {/* Header */}
        <header className="bg-white border-b border-[#FFA500]/20 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0A2463]">
                  Blog <span className="text-[#FFA500]">Admin</span>
                </h1>
                <p className="text-sm text-[#0A2463]/70 mt-1">Manage your blog content and SEO</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/blog')}
                  className="border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500]/10"
                >
                  View Blog
                </Button>
                <Button
                  onClick={() => navigate('/blog/admin/create')}
                  className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white shadow-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 bg-white shadow-lg p-2 rounded-2xl">
              <TabsTrigger 
                value="posts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFA500] data-[state=active]:to-[#F7931E] data-[state=active]:text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="categories"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFA500] data-[state=active]:to-[#F7931E] data-[state=active]:text-white"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger 
                value="tags"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFA500] data-[state=active]:to-[#F7931E] data-[state=active]:text-white"
              >
                <Tag className="mr-2 h-4 w-4" />
                Tags
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFA500] data-[state=active]:to-[#F7931E] data-[state=active]:text-white"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFA500] data-[state=active]:to-[#F7931E] data-[state=active]:text-white"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              <Card className="border-2 border-[#FFA500]/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Blog Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <BlogPostList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card className="border-2 border-[#FFA500]/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <BlogCategoryManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags">
              <Card className="border-2 border-[#FFA500]/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <BlogTagManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="border-2 border-[#FFA500]/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <BlogAnalytics />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="border-2 border-[#FFA500]/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Blog Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Settings className="h-16 w-16 mx-auto text-[#FFA500] mb-4" />
                    <h3 className="text-xl font-bold text-[#0A2463] mb-2">Blog Settings</h3>
                    <p className="text-[#0A2463]/70">
                      Configure your blog settings, SEO defaults, and more.
                    </p>
                    <p className="text-sm text-[#0A2463]/50 mt-4">Coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default BlogAdmin;

