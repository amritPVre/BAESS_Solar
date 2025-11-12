import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { getTags, createTag, updateTag, deleteTag, generateSlug } from '@/services/blogService';
import type { BlogTag } from '@/services/blogService';
import { toast } from 'sonner';

export const BlogTagManager = () => {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const { data } = await getTags();
      setTags(data);
    } catch (error) {
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tag?: BlogTag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        slug: tag.slug,
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        slug: '',
      });
    }
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      if (editingTag) {
        const { error } = await updateTag(editingTag.id, formData);
        if (error) throw new Error(error);
        toast.success('Tag updated successfully');
      } else {
        const { error } = await createTag(formData);
        if (error) throw new Error(error);
        toast.success('Tag created successfully');
      }
      setDialogOpen(false);
      loadTags();
    } catch (error: any) {
      console.error('Error saving tag:', error);
      toast.error(error.message || 'Failed to save tag');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const { error } = await deleteTag(id);
      if (error) throw new Error(error);
      toast.success('Tag deleted successfully');
      loadTags();
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-[#0A2463]/70">Loading tags...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#0A2463]/70">
          Manage blog tags to help readers discover related content
        </p>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="bg-white rounded-lg shadow-lg border-2 border-[#FFA500]/20 p-4 hover:border-[#FFA500] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-[#FFA500]" />
                <h3 className="font-bold text-[#0A2463]">{tag.name}</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {tag.post_count}
              </Badge>
            </div>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block mb-3">
              {tag.slug}
            </code>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDialog(tag)}
                className="flex-1 border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500]/10"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(tag.id)}
                disabled={tag.post_count > 0}
                className="border-red-500 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#0A2463]">
              {editingTag ? 'Edit Tag' : 'Add Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Update the tag details below.'
                : 'Create a new tag to categorize your blog posts.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., AI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., ai"
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
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

