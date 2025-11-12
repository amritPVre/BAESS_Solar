import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  generateSlug,
} from '@/services/blogService';
import type { BlogCategory } from '@/services/blogService';
import { toast } from 'sonner';

export const BlogCategoryManager = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#FFA500',
    icon: 'FolderOpen',
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await getCategories(false);
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: BlogCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color || '#FFA500',
        icon: category.icon || 'FolderOpen',
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: '#FFA500',
        icon: 'FolderOpen',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await updateCategory(editingCategory.id, formData);
        if (error) throw new Error(error);
        toast.success('Category updated successfully');
      } else {
        const { error } = await createCategory(formData);
        if (error) throw new Error(error);
        toast.success('Category created successfully');
      }
      setDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await deleteCategory(id);
      if (error) throw new Error(error);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-[#0A2463]/70">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#0A2463]/70">
          Manage blog categories to organize your content
        </p>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#FFA500]/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-[#FEF3C7] to-white">
              <TableHead className="font-bold text-[#0A2463]">Name</TableHead>
              <TableHead className="font-bold text-[#0A2463]">Slug</TableHead>
              <TableHead className="font-bold text-[#0A2463]">Posts</TableHead>
              <TableHead className="font-bold text-[#0A2463]">Status</TableHead>
              <TableHead className="font-bold text-[#0A2463] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} className="hover:bg-[#FEF3C7]/30">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-[#0A2463]">{category.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {category.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{category.post_count} posts</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={category.is_active ? 'default' : 'secondary'}
                    className={category.is_active ? 'bg-green-500' : 'bg-gray-400'}
                  >
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(category)}
                      className="border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500]/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(category.id)}
                      disabled={category.post_count > 0}
                      className="border-red-500 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#0A2463]">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below.'
                : 'Create a new category to organize your blog posts.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Solar Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., solar-technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#FFA500"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., Sun"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white"
            >
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

