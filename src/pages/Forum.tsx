import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, Search, Filter, TrendingUp, Star, CheckCircle, 
  ChevronRight, Clock, Eye, ThumbsUp, Users, Plus, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { 
  getTopics, 
  getCategories, 
  getTags,
  ForumTopic,
  ForumCategory,
  ForumTag 
} from '@/services/forumService';
import { formatDistanceToNow } from 'date-fns';

export const Forum = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [selectedCategory, sortBy, searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories and tags
      const { data: categoriesData } = await getCategories();
      const { data: tagsData } = await getTags();
      setCategories(categoriesData);
      setTags(tagsData);

      // Load topics with filters
      const { data: topicsData, count } = await getTopics({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchParams.get('search') || undefined,
        sort: sortBy as any,
        limit: 25
      });
      
      setTopics(topicsData);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ search: searchTerm, category: selectedCategory, sort: sortBy });
    } else {
      setSearchParams({ category: selectedCategory, sort: sortBy });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchParams({ category: categoryId, sort: sortBy });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setSearchParams({ category: selectedCategory, sort });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'solved':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Solved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      MessageSquare,
      Lightbulb: Star,
      Bug: Filter,
      MessageCircle: MessageSquare,
      Megaphone: TrendingUp
    };
    const IconComponent = icons[iconName] || MessageSquare;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-[#0A2463] hover:text-[#FFA500] transition-colors">
                <Home className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Home</span>
              </Link>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-[#FFA500]" />
                <h1 className="text-xl sm:text-2xl font-black text-[#0A2463]">
                  Community <span className="text-[#FFA500]">Forum</span>
                </h1>
              </div>
            </div>
            {user && (
              <Link to="/forum/new">
                <Button className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Topic</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-[#FFA500]/20 shadow-lg sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-[#0A2463] mb-4">Categories</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-[#FFA500] text-white font-semibold'
                        : 'hover:bg-[#FEF3C7] text-[#0A2463]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">All Topics</span>
                      <Badge variant="secondary">{totalCount}</Badge>
                    </div>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-[#FFA500] text-white font-semibold'
                          : 'hover:bg-[#FEF3C7] text-[#0A2463]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div style={{ color: selectedCategory === category.id ? 'white' : category.color }}>
                          {getCategoryIcon(category.icon || 'MessageSquare')}
                        </div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs opacity-80 ml-7">
                        <span>{category.topic_count} topics</span>
                        <span>{category.post_count} posts</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Popular Tags */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-[#0A2463] mb-3">Popular Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-[#FEF3C7] transition-colors"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <Card className="border-2 border-[#FFA500]/20 shadow-lg mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <Input
                      type="text"
                      placeholder="Search topics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-[#FFA500] hover:bg-[#F7931E]">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                  
                  <Tabs value={sortBy} onValueChange={handleSortChange} className="w-auto">
                    <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                      <TabsTrigger value="latest" className="text-xs sm:text-sm">
                        <Clock className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Latest</span>
                      </TabsTrigger>
                      <TabsTrigger value="popular" className="text-xs sm:text-sm">
                        <TrendingUp className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Popular</span>
                      </TabsTrigger>
                      <TabsTrigger value="unanswered" className="text-xs sm:text-sm">
                        <MessageSquare className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">No Reply</span>
                      </TabsTrigger>
                      <TabsTrigger value="solved" className="text-xs sm:text-sm">
                        <CheckCircle className="h-3 w-3 sm:mr-1" />
                        <span className="hidden sm:inline">Solved</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Topics List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFA500]"></div>
                <p className="mt-4 text-[#0A2463]/70">Loading topics...</p>
              </div>
            ) : topics.length === 0 ? (
              <Card className="border-2 border-[#FFA500]/20 shadow-lg">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-16 w-16 text-[#0A2463]/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#0A2463] mb-2">No topics found</h3>
                  <p className="text-[#0A2463]/70 mb-6">Be the first to start a discussion!</p>
                  {user && (
                    <Link to="/forum/new">
                      <Button className="bg-gradient-to-r from-[#FFA500] to-[#F7931E]">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Topic
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <Link key={topic.id} to={`/forum/topic/${topic.slug}`}>
                    <Card className="border-2 border-[#FFA500]/20 hover:border-[#FFA500] shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          {/* Author Avatar */}
                          <div className="hidden sm:block">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFA500] to-[#F7931E] flex items-center justify-center text-white font-bold">
                              {topic.author?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          </div>

                          {/* Topic Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  {topic.is_pinned && (
                                    <Badge className="bg-[#8B5CF6]">
                                      <Star className="h-3 w-3 mr-1" />
                                      Pinned
                                    </Badge>
                                  )}
                                  {topic.is_featured && (
                                    <Badge className="bg-[#10B981]">Featured</Badge>
                                  )}
                                  {getStatusBadge(topic.status)}
                                  {topic.category && (
                                    <Badge 
                                      variant="outline" 
                                      style={{ borderColor: topic.category.color, color: topic.category.color }}
                                    >
                                      {topic.category.name}
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-lg font-bold text-[#0A2463] group-hover:text-[#FFA500] transition-colors line-clamp-2 mb-1">
                                  {topic.title}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-[#0A2463]/60">
                                  <span className="font-medium">{topic.author?.name || 'Anonymous'}</span>
                                  <span>·</span>
                                  <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 sm:gap-6 text-sm text-[#0A2463]/70 mt-4">
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="font-medium">{topic.reply_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span className="font-medium">{topic.view_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="font-medium">{topic.like_count}</span>
                              </div>
                              {topic.participant_count > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium">{topic.participant_count}</span>
                                </div>
                              )}
                              {topic.last_reply_at && topic.last_reply_author && (
                                <div className="hidden lg:flex items-center gap-2 ml-auto text-xs">
                                  <span className="text-[#0A2463]/50">Last reply by</span>
                                  <span className="font-semibold text-[#0A2463]">
                                    {topic.last_reply_author.name}
                                  </span>
                                  <span className="text-[#0A2463]/50">
                                    {formatDistanceToNow(new Date(topic.last_reply_at), { addSuffix: true })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="hidden sm:flex items-center">
                            <ChevronRight className="h-5 w-5 text-[#0A2463]/30 group-hover:text-[#FFA500] group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;

