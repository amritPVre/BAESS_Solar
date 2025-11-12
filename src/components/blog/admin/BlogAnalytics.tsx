import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, TrendingUp, Users, Calendar, FolderOpen } from 'lucide-react';
import { getPosts, getCategories, getTags } from '@/services/blogService';
import type { BlogPost } from '@/services/blogService';

export const BlogAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    avgViewsPerPost: 0,
    categoriesCount: 0,
    tagsCount: 0,
    postsThisMonth: 0,
  });
  const [topPosts, setTopPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load all posts
      const { data: posts } = await getPosts({});
      
      // Load categories and tags
      const { data: categories } = await getCategories(false);
      const { data: tags } = await getTags();

      // Calculate stats
      const totalPosts = posts.length;
      const publishedPosts = posts.filter((p) => p.status === 'published').length;
      const draftPosts = posts.filter((p) => p.status === 'draft').length;
      const totalViews = posts.reduce((sum, p) => sum + p.view_count, 0);
      const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;

      // Posts this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const postsThisMonth = posts.filter((p) => {
        const createdAt = new Date(p.created_at);
        return createdAt >= firstDayOfMonth;
      }).length;

      // Top posts by views
      const sortedByViews = [...posts].sort((a, b) => b.view_count - a.view_count).slice(0, 5);

      setStats({
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews,
        avgViewsPerPost,
        categoriesCount: categories.length,
        tagsCount: tags.length,
        postsThisMonth,
      });
      setTopPosts(sortedByViews);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-[#0A2463]/70">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-[#FFA500]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#0A2463]">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-[#FFA500]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2463]">{stats.totalPosts}</div>
            <p className="text-xs text-[#0A2463]/70 mt-1">
              {stats.publishedPosts} published, {stats.draftPosts} drafts
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#FFA500]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#0A2463]">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-[#3B82F6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2463]">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-[#0A2463]/70 mt-1">
              Avg {stats.avgViewsPerPost} views per post
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#FFA500]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#0A2463]">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-[#10B981]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2463]">{stats.postsThisMonth}</div>
            <p className="text-xs text-[#0A2463]/70 mt-1">Posts created</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#FFA500]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#0A2463]">Categories & Tags</CardTitle>
            <FolderOpen className="h-4 w-4 text-[#8B5CF6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0A2463]">
              {stats.categoriesCount + stats.tagsCount}
            </div>
            <p className="text-xs text-[#0A2463]/70 mt-1">
              {stats.categoriesCount} categories, {stats.tagsCount} tags
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts */}
      <Card className="border-2 border-[#FFA500]/20">
        <CardHeader>
          <CardTitle className="text-[#0A2463] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#FFA500]" />
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <p className="text-center text-[#0A2463]/70 py-8">No posts yet</p>
          ) : (
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#FEF3C7] to-white rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#FFA500] to-[#F7931E] rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  {post.featured_image && (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#0A2463] truncate">{post.title}</h4>
                    <p className="text-sm text-[#0A2463]/70">
                      {post.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[#0A2463]">
                    <Eye className="h-4 w-4" />
                    <span className="font-bold">{post.view_count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing Activity Chart Placeholder */}
      <Card className="border-2 border-[#FFA500]/20">
        <CardHeader>
          <CardTitle className="text-[#0A2463]">Publishing Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-[#FFA500] mb-4" />
            <h3 className="text-xl font-bold text-[#0A2463] mb-2">Activity Chart</h3>
            <p className="text-[#0A2463]/70">
              Visual charts and graphs for publishing trends
            </p>
            <p className="text-sm text-[#0A2463]/50 mt-4">Coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

