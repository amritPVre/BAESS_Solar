import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, Eye, Search, Calendar, User } from 'lucide-react';
import { getPosts, deletePost, getCategories } from '@/services/blogService';
import type { BlogPost, BlogCategory } from '@/services/blogService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const BlogPostList = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData } = await getCategories(false);
      setCategories(categoriesData);

      // Load posts with filters
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const { data: postsData } = await getPosts(filters);
      setPosts(postsData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      const { error } = await deletePost(postToDelete.id);
      if (error) throw new Error(error);

      toast.success('Post deleted successfully');
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      published: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      draft: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
      archived: { variant: 'outline', className: 'bg-gray-500 hover:bg-gray-600 text-white' },
    };
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-[#0A2463]/70">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2463]/50" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleSearch}
          className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white"
        >
          Search
        </Button>
      </div>

      {/* Posts Table */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-[#FFA500]/30">
          <p className="text-[#0A2463]/70 mb-4">No posts found</p>
          <Button
            onClick={() => navigate('/blog/admin/create')}
            className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white"
          >
            Create Your First Post
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#FFA500]/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-[#FEF3C7] to-white">
                <TableHead className="font-bold text-[#0A2463]">Title</TableHead>
                <TableHead className="font-bold text-[#0A2463]">Category</TableHead>
                <TableHead className="font-bold text-[#0A2463]">Status</TableHead>
                <TableHead className="font-bold text-[#0A2463]">Author</TableHead>
                <TableHead className="font-bold text-[#0A2463]">Published</TableHead>
                <TableHead className="font-bold text-[#0A2463]">Views</TableHead>
                <TableHead className="font-bold text-[#0A2463] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} className="hover:bg-[#FEF3C7]/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {post.featured_image && (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-[#0A2463]">{post.title}</p>
                        <p className="text-xs text-[#0A2463]/60 line-clamp-1">{post.excerpt}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.category && (
                      <Badge style={{ backgroundColor: post.category.color }}>
                        {post.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#0A2463]/50" />
                      <span className="text-sm">{post.author?.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#0A2463]/50" />
                      <span className="text-sm">{formatDate(post.published_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[#0A2463]/50" />
                      <span className="text-sm">{post.view_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/blog/admin/edit/${post.id}`)}
                        className="border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500]/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(post)}
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

