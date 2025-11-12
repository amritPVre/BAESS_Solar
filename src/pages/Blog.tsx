import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar, Clock, User, ArrowRight, Home } from 'lucide-react';
import { getPosts, getCategories } from '@/services/blogService';
import type { BlogPost, BlogCategory } from '@/services/blogService';
import { Helmet } from 'react-helmet';

export const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      // First load categories
      const { data: categoriesData } = await getCategories();
      setCategories(categoriesData);
      
      // Convert slug to ID if needed
      let categoryId: string | undefined = undefined;
      if (selectedCategory !== 'all') {
        // Check if selectedCategory is a slug or ID
        const categoryBySlug = categoriesData.find((c) => c.slug === selectedCategory);
        const categoryById = categoriesData.find((c) => c.id === selectedCategory);
        categoryId = categoryBySlug?.id || categoryById?.id || undefined;
      }
      
      // Then load posts with correct category ID
      const { data: postsData } = await getPosts({
        status: 'published',
        category: categoryId,
        search: searchTerm || undefined,
      });
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading blog data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categorySlug: string) => {
    const category = categories.find((c) => c.slug === categorySlug);
    setSelectedCategory(category?.id || 'all');
    setSearchParams(category ? { category: categorySlug } : {});
  };

  const handleSearch = () => {
    loadData();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Helmet>
        <title>Blog | BAESS Labs - Solar Energy Insights & Updates</title>
        <meta
          name="description"
          content="Stay updated with the latest solar energy news, technology insights, and industry trends from BAESS Labs."
        />
        <meta
          name="keywords"
          content="solar energy blog, solar technology, PV design, BOQ generation, solar industry news"
        />
        <meta property="og:title" content="Blog | BAESS Labs" />
        <meta property="og:description" content="Solar energy insights and updates from BAESS Labs" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#0A2463] via-[#0A2463] to-[#0F2E5C] text-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#FFA500] hover:text-[#F7931E] mb-6 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6">
              BAESS Labs <span className="text-[#FFA500]">Blog</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl">
              Explore the latest insights in solar technology, design tips, and industry updates
            </p>
          </div>
        </section>

        {/* Filters Section */}
        <section className="bg-white border-b border-[#FFA500]/20 py-6 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0A2463]/50" />
                <Input
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => handleCategoryChange('all')}
                  className={
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-[#FFA500] to-[#F7931E] text-white'
                      : ''
                  }
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    onClick={() => handleCategoryChange(category.slug)}
                    style={{
                      backgroundColor:
                        selectedCategory === category.id ? category.color : undefined,
                      borderColor: category.color,
                      color: selectedCategory === category.id ? 'white' : category.color,
                    }}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-16 h-16 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[#0A2463] font-semibold">Loading articles...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#0A2463]/70 text-lg">No articles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="border-2 border-[#FFA500]/20 hover:border-[#FFA500] transition-all duration-300 hover:shadow-2xl group overflow-hidden"
                >
                  <Link to={`/blog/${post.slug}`}>
                    {/* Featured Image */}
                    {post.featured_image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.featured_image_alt || post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {post.category && (
                          <Badge
                            className="absolute top-4 left-4"
                            style={{ backgroundColor: post.category.color }}
                          >
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                    )}

                    <CardContent className="p-6 space-y-4">
                      {/* Title */}
                      <h2 className="text-xl font-bold text-[#0A2463] group-hover:text-[#FFA500] transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-[#0A2463]/70 line-clamp-3">{post.excerpt}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-[#0A2463]/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.read_time_minutes} min read</span>
                        </div>
                      </div>

                      {/* Author */}
                      {post.author && (
                        <div className="flex items-center gap-2 pt-4 border-t border-[#FFA500]/20">
                          <User className="h-4 w-4 text-[#0A2463]/50" />
                          <span className="text-sm text-[#0A2463]/70">{post.author.name}</span>
                        </div>
                      )}

                      {/* Read More */}
                      <div className="flex items-center gap-2 text-[#FFA500] font-semibold group-hover:gap-4 transition-all">
                        <span>Read More</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="bg-[#0A2463] text-white py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
              {/* Company Info */}
              <div>
                <div className="mb-4">
                  <img
                    src="/BAESS_logo_v02.png"
                    alt="BAESS Labs"
                    className="h-10 w-auto object-contain brightness-0 invert"
                  />
                </div>
                <p className="text-sm text-white/70">
                  Next-generation solar intelligence platform powered by AI.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/#features"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/#pricing"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/integrations"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      Integrations
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/about"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/careers"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/blog"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-sm font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/privacy"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="text-sm text-white/70 hover:text-[#FFA500] transition-colors"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 text-center">
              <p className="text-sm text-white/70">
                © {new Date().getFullYear()} BAESS Labs. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Blog;

