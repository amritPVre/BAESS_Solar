import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, ArrowLeft, Tag as TagIcon, Eye, Share2 } from 'lucide-react';
import { getPostBySlug, incrementViewCount, getPosts } from '@/services/blogService';
import type { BlogPost } from '@/services/blogService';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

export const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (postSlug: string) => {
    setLoading(true);
    try {
      const { data, error } = await getPostBySlug(postSlug);
      
      if (error || !data) {
        toast.error('Post not found');
        navigate('/blog');
        return;
      }

      setPost(data);
      
      // Increment view count
      await incrementViewCount(data.id);

      // Load related posts
      if (data.category_id) {
        const { data: related } = await getPosts({
          status: 'published',
          category: data.category_id,
          limit: 3,
        });
        setRelatedPosts(related.filter((p) => p.id !== data.id).slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load post');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#FFA500] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#0A2463] font-semibold">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} | BAESS Labs Blog</title>
        <meta
          name="description"
          content={post.meta_description || post.excerpt || ''}
        />
        {post.meta_keywords && <meta name="keywords" content={post.meta_keywords} />}
        {post.canonical_url && <link rel="canonical" href={post.canonical_url} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt || ''} />
        <meta property="og:image" content={post.og_image || post.featured_image || ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.meta_title || post.title} />
        <meta name="twitter:description" content={post.meta_description || post.excerpt || ''} />
        <meta name="twitter:image" content={post.og_image || post.featured_image || ''} />
        
        {/* Article Meta */}
        {post.published_at && (
          <meta property="article:published_time" content={post.published_at} />
        )}
        {post.updated_at && (
          <meta property="article:modified_time" content={post.updated_at} />
        )}
        {post.author && <meta property="article:author" content={post.author.name} />}
        {post.category && (
          <meta property="article:section" content={post.category.name} />
        )}
        {post.tags?.map((tag) => (
          <meta key={tag.id} property="article:tag" content={tag.name} />
        ))}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#FEF3C7] via-white to-[#FEF3C7]">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#0A2463] via-[#0A2463] to-[#0F2E5C] text-white py-12 pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-[#FFA500] hover:text-[#F7931E] mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Blog</span>
            </Link>

            {/* Category Badge */}
            {post.category && (
              <Badge
                className="mb-4"
                style={{ backgroundColor: post.category.color }}
              >
                {post.category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-8">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90 text-sm sm:text-base">
              {post.author && (
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{post.author.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{formatDate(post.published_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{post.read_time_minutes} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <span>{post.view_count} views</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {post.featured_image && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl -mt-20 mb-12 relative z-10">
            <img
              src={post.featured_image}
              alt={post.featured_image_alt || post.title}
              className="w-full h-96 sm:h-[500px] object-cover rounded-2xl shadow-2xl border-4 border-white"
            />
          </section>
        )}

        {/* Main Content */}
        <article className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl pb-12">
          {/* Article Content - Full Width, Medium-style */}
          <div className="max-w-[740px] mx-auto">
            <Card className="border-2 border-[#FFA500]/20 shadow-xl">
              <CardContent className="p-6 sm:p-10 md:p-16">
                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-xl sm:text-2xl text-[#0A2463]/80 mb-10 italic border-l-4 border-[#FFA500] pl-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                {/* Content with Markdown Rendering */}
                <style>{`
                  .image-caption,
                  .pdf-caption {
                    text-align: center;
                    font-size: 0.875rem;
                    color: rgba(10, 36, 99, 0.7);
                    font-style: italic;
                    margin-top: 0.75rem;
                    padding: 0 1rem;
                  }
                  .content-image img {
                    width: 100%;
                    display: block;
                  }
                  .content-image p {
                    margin: 0;
                    padding: 1rem;
                    background: linear-gradient(to bottom, rgba(254, 243, 199, 0.3), rgba(254, 243, 199, 0.1));
                  }
                  .pdf-viewer iframe {
                    border: none;
                  }
                  .pdf-viewer p {
                    margin: 0;
                    padding: 1rem;
                    background: rgba(10, 36, 99, 0.05);
                    border-top: 1px solid rgba(10, 36, 99, 0.1);
                  }
                `}</style>
                <div className="prose prose-lg prose-slate max-w-none markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-4xl font-black text-[#0A2463] mt-12 mb-6 leading-tight">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-3xl font-bold text-[#0A2463] mt-10 mb-5 leading-tight">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-2xl font-bold text-[#0A2463] mt-8 mb-4 leading-snug">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-xl font-bold text-[#0A2463] mt-6 mb-3 leading-snug">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => (
                        <p className="text-lg text-[#0A2463]/90 mb-6 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-6 mb-6 space-y-3 text-lg text-[#0A2463]/90">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-outside ml-6 mb-6 space-y-3 text-lg text-[#0A2463]/90">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="leading-relaxed">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#FFA500] pl-6 py-2 my-6 italic text-[#0A2463]/80 bg-[#FEF3C7]/30 rounded-r-lg">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-[#FEF3C7] text-[#0A2463] px-2 py-1 rounded text-sm font-mono">
                            {children}
                          </code>
                        ) : (
                          <code className="block bg-[#0A2463] text-[#FEF3C7] p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="bg-[#0A2463] text-[#FEF3C7] p-4 rounded-lg overflow-x-auto my-6">
                          {children}
                        </pre>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-[#0A2463]">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-[#0A2463]/90">{children}</em>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FFA500] hover:text-[#F7931E] underline font-medium transition-colors"
                        >
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) => (
                        <img
                          src={src}
                          alt={alt || ''}
                          className="w-full rounded-lg my-8 shadow-lg"
                        />
                      ),
                      // Custom div handling for content-image and pdf-viewer
                      div: ({ children, className }) => {
                        if (className === 'content-image') {
                          return (
                            <div className="my-10 rounded-xl overflow-hidden border-2 border-[#FFA500]/20 shadow-xl">
                              {children}
                            </div>
                          );
                        }
                        if (className === 'pdf-viewer') {
                          return (
                            <div className="my-10 rounded-xl overflow-hidden border-2 border-[#0A2463]/20 shadow-xl bg-gray-50">
                              {children}
                            </div>
                          );
                        }
                        return <div className={className}>{children}</div>;
                      },
                      // Handle iframes (for PDF viewers)
                      iframe: ({ src, title }) => (
                        <iframe
                          src={src}
                          title={title || 'Embedded content'}
                          className="w-full h-[600px] rounded-lg"
                          allowFullScreen
                        />
                      ),
                      hr: () => <hr className="border-t-2 border-[#FFA500]/20 my-10" />,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-8">
                          <table className="min-w-full border-collapse border border-[#FFA500]/20">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-[#FFA500]/20 bg-[#FEF3C7] px-4 py-2 text-left font-bold text-[#0A2463]">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-[#FFA500]/20 px-4 py-2 text-[#0A2463]/90">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>

                <Separator className="my-8" />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <TagIcon className="h-5 w-5 text-[#0A2463]/50" />
                    {post.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-[#FFA500] border-[#FFA500]">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Share Button */}
                <Button
                  onClick={handleShare}
                  className="bg-gradient-to-r from-[#FFA500] to-[#F7931E] hover:from-[#F7931E] hover:to-[#FFA500] text-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Article
                </Button>
              </CardContent>
            </Card>

            {/* Author Card */}
            {post.author && (
              <Card className="border-2 border-[#FFA500]/20 shadow-xl mt-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#FFA500] to-[#F7931E] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {post.author.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0A2463] text-lg">
                        {post.author.name}
                      </h3>
                      <p className="text-sm text-[#0A2463]/70">{post.author.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Posts - Full Width Below Article */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-3xl font-bold text-[#0A2463] mb-8">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      to={`/blog/${related.slug}`}
                      className="block group"
                    >
                      <Card className="border-2 border-[#FFA500]/20 hover:border-[#FFA500] transition-all duration-300 hover:shadow-xl overflow-hidden">
                        {related.featured_image && (
                          <img
                            src={related.featured_image}
                            alt={related.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        )}
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-[#0A2463] group-hover:text-[#FFA500] transition-colors line-clamp-2 mb-2">
                            {related.title}
                          </h4>
                          <p className="text-xs text-[#0A2463]/60">
                            {formatDate(related.published_at)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Footer */}
        <footer className="bg-[#0A2463] text-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-white/70">
              © {new Date().getFullYear()} BAESS Labs. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default BlogPost;

