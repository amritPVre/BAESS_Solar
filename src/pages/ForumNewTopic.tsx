import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  createTopic, 
  getCategories, 
  getTags, 
  generateSlug,
  ForumCategory,
  ForumTag 
} from '@/services/forumService';
import { toast } from 'sonner';

export const ForumNewTopic = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: categoriesData } = await getCategories();
      const { data: tagsData } = await getTags();
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter content');
      return;
    }

    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      const slug = generateSlug(title);
      const { error } = await createTopic({
        title: title.trim(),
        slug,
        content: content.trim(),
        category_id: categoryId,
        tags: selectedTags,
        status: 'open'
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Topic created successfully!');
        navigate(`/forum/topic/${slug}`);
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFA500]"></div>
          <p className="mt-4 text-[#0A2463]/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-[#0A2463]/70">
            <Link to="/" className="hover:text-[#FFA500] transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/forum" className="hover:text-[#FFA500] transition-colors">
              Forum
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#0A2463] font-medium">New Topic</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <Card className="border-2 border-[#FFA500]/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-black text-[#0A2463]">
              Create New Topic
            </CardTitle>
            <p className="text-[#0A2463]/70">
              Share your thoughts, ask questions, or start a discussion with the community.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#0A2463] font-semibold">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter a descriptive title for your topic..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={300}
                  className="text-lg"
                />
                <p className="text-xs text-[#0A2463]/50">
                  {title.length}/300 characters
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[#0A2463] font-semibold">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#0A2463]/50">
                  Choose the most appropriate category for your topic
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-[#0A2463] font-semibold">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Describe your topic in detail. Be clear and provide context..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
                <p className="text-xs text-[#0A2463]/50">
                  Tip: You can use plain text. Markdown support coming soon!
                </p>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-[#0A2463] font-semibold">
                  Tags (Optional)
                </Label>
                <div className="flex flex-wrap gap-2 p-4 bg-[#FEF3C7] rounded-lg">
                  {tags.length === 0 ? (
                    <p className="text-sm text-[#0A2463]/50">No tags available</p>
                  ) : (
                    tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        style={
                          selectedTags.includes(tag.id)
                            ? { backgroundColor: tag.color, borderColor: tag.color }
                            : { borderColor: tag.color, color: tag.color }
                        }
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  )}
                </div>
                <p className="text-xs text-[#0A2463]/50">
                  Select tags to help others find your topic (max 5)
                </p>
              </div>

              {/* Guidelines */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Community Guidelines</h4>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>Be respectful and courteous to all community members</li>
                  <li>Keep topics relevant and search for duplicates before posting</li>
                  <li>Provide clear titles and detailed descriptions</li>
                  <li>Use appropriate categories and tags</li>
                  <li>Avoid spam, self-promotion, or off-topic content</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={submitting || !title.trim() || !content.trim() || !categoryId}
                  className="flex-1 bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold py-6"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {submitting ? 'Creating Topic...' : 'Create Topic'}
                </Button>
                <Link to="/forum" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6 border-2"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-2 border-[#3B82F6]/20 shadow-lg mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-[#0A2463] mb-3">
              💡 Tips for a Great Topic
            </h3>
            <ul className="space-y-2 text-sm text-[#0A2463]/70">
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">•</span>
                <span><strong>Be specific:</strong> Clear, descriptive titles get more responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">•</span>
                <span><strong>Provide context:</strong> Include relevant details and background information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">•</span>
                <span><strong>Use formatting:</strong> Break long content into paragraphs for readability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFA500] font-bold">•</span>
                <span><strong>Engage with replies:</strong> Thank contributors and mark helpful answers as solutions</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForumNewTopic;

