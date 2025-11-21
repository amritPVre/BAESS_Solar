import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, X, Clock, Calendar } from 'lucide-react';
import {
  getPostById,
  createPost,
  updatePost,
  getCategories,
  getTags,
  generateSlug,
  calculateReadTime,
  truncateExcerpt,
} from '@/services/blogService';
import type { BlogPostInput, BlogCategory, BlogTag } from '@/services/blogService';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';

export const BlogPostEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [formData, setFormData] = useState<BlogPostInput>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    featured_image_alt: '',
    category_id: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_image: '',
    canonical_url: '',
    status: 'draft',
    published_at: '',
    scheduled_at: '',
    read_time_minutes: 5,
    tags: [],
  });

  // Scheduling state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      // Load categories and tags
      const [{ data: categoriesData }, { data: tagsData }] = await Promise.all([
        getCategories(),
        getTags(),
      ]);
      setCategories(categoriesData);
      setTags(tagsData);

      // Load post if in edit mode
      if (isEditMode && id) {
        const { data: post, error } = await getPostById(id);
        if (error || !post) {
          toast.error('Post not found');
          navigate('/blog/admin');
          return;
        }

        setFormData({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || '',
          content: post.content,
          featured_image: post.featured_image || '',
          featured_image_alt: post.featured_image_alt || '',
          category_id: post.category_id || '',
          meta_title: post.meta_title || '',
          meta_description: post.meta_description || '',
          meta_keywords: post.meta_keywords || '',
          og_image: post.og_image || '',
          canonical_url: post.canonical_url || '',
          status: post.status,
          published_at: post.published_at || '',
          read_time_minutes: post.read_time_minutes,
        });
        setSelectedTags(post.tags?.map((t) => t.id) || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: title.substring(0, 60),
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
      excerpt: prev.excerpt || truncateExcerpt(content),
      read_time_minutes: calculateReadTime(content),
    }));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async (status: 'draft' | 'published' | 'scheduled', scheduledDateTime?: string) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    if (!formData.featured_image || !formData.featured_image.trim()) {
      toast.error('Featured image is required');
      return;
    }

    // Validate scheduled date if status is scheduled
    if (status === 'scheduled' && !scheduledDateTime) {
      toast.error('Please select a date and time for scheduling');
      return;
    }

    setSaving(true);
    try {
      // Determine published_at and scheduled_at based on status
      let published_at = formData.published_at || null;
      let scheduled_at = formData.scheduled_at || null;

      if (status === 'published') {
        published_at = new Date().toISOString();
        scheduled_at = null;
      } else if (status === 'scheduled' && scheduledDateTime) {
        scheduled_at = scheduledDateTime;
        published_at = null;
      } else if (status === 'draft') {
        // Keep existing values for drafts
        published_at = formData.published_at || null;
        scheduled_at = null;
      }

      // Convert empty strings to null for optional fields
      const postData: BlogPostInput = {
        ...formData,
        status,
        published_at,
        scheduled_at,
        tags: selectedTags,
        // Convert empty strings to null for UUID and optional fields
        category_id: formData.category_id || null,
        featured_image: formData.featured_image || null,
        featured_image_alt: formData.featured_image_alt || null,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        meta_keywords: formData.meta_keywords || null,
        og_image: formData.og_image || null,
        canonical_url: formData.canonical_url || null,
        excerpt: formData.excerpt || null,
      };

      if (isEditMode && id) {
        const { error } = await updatePost(id, postData);
        if (error) throw new Error(error);
        
        if (status === 'scheduled') {
          toast.success(`Post scheduled for ${new Date(scheduledDateTime!).toLocaleString()}`);
        } else {
          toast.success('Post updated successfully');
        }
      } else {
        const { error } = await createPost(postData);
        if (error) throw new Error(error);
        
        if (status === 'scheduled') {
          toast.success(`Post scheduled for ${new Date(scheduledDateTime!).toLocaleString()}`);
        } else {
          toast.success('Post created successfully');
        }
      }

      setShowScheduleDialog(false);
      navigate('/blog/admin');
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  // Handle scheduling
  const handleScheduleClick = () => {
    setShowScheduleDialog(true);
    
    // Set default date/time (tomorrow at 9 AM)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const dateStr = tomorrow.toISOString().split('T')[0];
    const timeStr = '09:00';
    
    setScheduleDate(dateStr);
    setScheduleTime(timeStr);
  };

  const handleScheduleSave = () => {
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please select both date and time');
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();

    // Validate: Must be in the future
    if (scheduledDateTime <= now) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    // Validate: Maximum 14 days in the future
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 14);
    if (scheduledDateTime > maxDate) {
      toast.error('Cannot schedule more than 14 days in advance');
      return;
    }

    // Save with scheduled status
    handleSave('scheduled', scheduledDateTime.toISOString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#0A2463] font-semibold">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditMode ? 'Edit Post' : 'Create Post'} | Blog Admin | BAESS Labs</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
        {/* Header */}
        <header className="bg-white border-b border-[#FFA500]/20 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/blog/admin')}
                  className="border-[#FFA500] text-[#FFA500] hover:bg-[#FFA500]/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <h1 className="text-2xl font-black text-[#0A2463]">
                  {isEditMode ? 'Edit' : 'Create'} <span className="text-[#FFA500]">Post</span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  variant="outline"
                  className="border-[#0A2463] text-[#0A2463] hover:bg-[#0A2463]/10"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  onClick={handleScheduleClick}
                  disabled={saving}
                  variant="outline"
                  className="border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Publish Now
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-[#FFA500]/20">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Post Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter post title..."
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="post-slug"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief summary of your post..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Write your post content here..."
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-[#0A2463]/60">
                      Read time: {formData.read_time_minutes} min
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card className="border-2 border-[#FFA500]/20">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">SEO Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="meta" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="meta">Meta Tags</TabsTrigger>
                      <TabsTrigger value="social">Social Media</TabsTrigger>
                    </TabsList>
                    <TabsContent value="meta" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="meta_title">Meta Title</Label>
                        <Input
                          id="meta_title"
                          value={formData.meta_title}
                          onChange={(e) =>
                            setFormData({ ...formData, meta_title: e.target.value })
                          }
                          placeholder="SEO title (60 chars max)"
                          maxLength={60}
                        />
                        <p className="text-xs text-[#0A2463]/60">
                          {formData.meta_title?.length || 0}/60
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meta_description">Meta Description</Label>
                        <Textarea
                          id="meta_description"
                          value={formData.meta_description}
                          onChange={(e) =>
                            setFormData({ ...formData, meta_description: e.target.value })
                          }
                          placeholder="SEO description (160 chars max)"
                          rows={3}
                          maxLength={160}
                        />
                        <p className="text-xs text-[#0A2463]/60">
                          {formData.meta_description?.length || 0}/160
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meta_keywords">Meta Keywords</Label>
                        <Input
                          id="meta_keywords"
                          value={formData.meta_keywords}
                          onChange={(e) =>
                            setFormData({ ...formData, meta_keywords: e.target.value })
                          }
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="social" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="og_image">Open Graph Image URL</Label>
                        <Input
                          id="og_image"
                          value={formData.og_image}
                          onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                          placeholder="https://example.com/og-image.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="canonical_url">Canonical URL</Label>
                        <Input
                          id="canonical_url"
                          value={formData.canonical_url}
                          onChange={(e) =>
                            setFormData({ ...formData, canonical_url: e.target.value })
                          }
                          placeholder="https://example.com/blog/post-slug"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Featured Image */}
              <Card className="border-2 border-[#FFA500]/20">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Featured Image *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="featured_image">Image URL</Label>
                    <Input
                      id="featured_image"
                      value={formData.featured_image}
                      onChange={(e) =>
                        setFormData({ ...formData, featured_image: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {formData.featured_image && (
                    <div className="relative">
                      <img
                        src={formData.featured_image}
                        alt="Featured"
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/400x300?text=Invalid+Image';
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="featured_image_alt">Alt Text</Label>
                    <Input
                      id="featured_image_alt"
                      value={formData.featured_image_alt}
                      onChange={(e) =>
                        setFormData({ ...formData, featured_image_alt: e.target.value })
                      }
                      placeholder="Describe the image"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Category */}
              <Card className="border-2 border-[#FFA500]/20">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="border-2 border-[#FFA500]/20">
                <CardHeader>
                  <CardTitle className="text-[#0A2463]">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                        className={`cursor-pointer ${
                          selectedTags.includes(tag.id)
                            ? 'bg-[#FFA500] hover:bg-[#F7931E]'
                            : 'hover:bg-[#FFA500]/10'
                        }`}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                        {selectedTags.includes(tag.id) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Schedule Dialog */}
        {showScheduleDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-2 border-[#FFA500]">
              <CardHeader>
                <CardTitle className="text-[#0A2463] flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FFA500]" />
                  Schedule Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">
                    Publication Date <span className="text-[#FFA500]">*</span>
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                    max={new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]} // 14 days
                    className="border-[#FFA500]/50 focus:border-[#FFA500]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-time">
                    Publication Time <span className="text-[#FFA500]">*</span>
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="border-[#FFA500]/50 focus:border-[#FFA500]"
                  />
                </div>

                <div className="bg-[#FEF3C7] border border-[#FFA500]/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-[#0A2463] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FFA500]" />
                    Scheduling Guidelines
                  </p>
                  <ul className="text-xs text-[#0A2463]/80 space-y-1 ml-6 list-disc">
                    <li>Posts can be scheduled up to 14 days in advance</li>
                    <li>Scheduled posts will auto-publish at the selected time</li>
                    <li>You can edit or reschedule before publication</li>
                    <li>Best for SEO: Space posts 2-3 days apart</li>
                  </ul>
                </div>

                {scheduleDate && scheduleTime && (
                  <div className="bg-white border border-[#FFA500] rounded-lg p-3">
                    <p className="text-sm text-[#0A2463]">
                      <span className="font-semibold">Will publish on:</span>
                      <br />
                      <span className="text-[#FFA500]">
                        {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowScheduleDialog(false)}
                    variant="outline"
                    className="flex-1 border-[#0A2463] text-[#0A2463]"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleScheduleSave}
                    disabled={saving || !scheduleDate || !scheduleTime}
                    className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#8B5CF6] text-white"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {saving ? 'Scheduling...' : 'Schedule Post'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default BlogPostEditor;

