-- Migration: Create Blog System
-- Created: 2025-01-31
-- Description: Complete blog CMS system with posts, categories, tags, and SEO features

-- =============================================
-- 1. Blog Categories Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#FFA500', -- Brand color
  icon VARCHAR(50), -- Icon name from lucide-react
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. Blog Tags Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. Blog Posts Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT, -- URL to featured image
  featured_image_alt TEXT,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  
  -- SEO Fields
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords TEXT,
  og_image TEXT, -- Open Graph image
  canonical_url TEXT,
  
  -- Status and Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement Metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Full-text search
  search_vector tsvector
);

-- =============================================
-- 4. Blog Post Tags (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id)
);

-- =============================================
-- 5. Blog Comments Table (Optional for future)
-- =============================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name VARCHAR(100),
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  parent_comment_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. Create Indexes
-- =============================================

-- Blog Posts Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search_vector ON public.blog_posts USING gin(search_vector);

-- Categories Indexes
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_active ON public.blog_categories(is_active);

-- Tags Indexes
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);

-- Post Tags Indexes
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON public.blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON public.blog_post_tags(tag_id);

-- Comments Indexes
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON public.blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON public.blog_comments(is_approved);

-- =============================================
-- 7. Create Functions
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update search vector for full-text search
CREATE OR REPLACE FUNCTION public.update_blog_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update category post count
CREATE OR REPLACE FUNCTION public.update_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_categories 
    SET post_count = post_count + 1 
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_categories 
    SET post_count = post_count - 1 
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.category_id != OLD.category_id THEN
    UPDATE public.blog_categories 
    SET post_count = post_count - 1 
    WHERE id = OLD.category_id;
    UPDATE public.blog_categories 
    SET post_count = post_count + 1 
    WHERE id = NEW.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update tag post count
CREATE OR REPLACE FUNCTION public.update_tag_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_tags 
    SET post_count = post_count + 1 
    WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_tags 
    SET post_count = post_count - 1 
    WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. Create Triggers
-- =============================================

-- Trigger for updated_at on blog_posts
DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trigger_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_updated_at();

-- Trigger for updated_at on blog_categories
DROP TRIGGER IF EXISTS trigger_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER trigger_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_updated_at();

-- Trigger for updated_at on blog_tags
DROP TRIGGER IF EXISTS trigger_blog_tags_updated_at ON public.blog_tags;
CREATE TRIGGER trigger_blog_tags_updated_at
  BEFORE UPDATE ON public.blog_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_updated_at();

-- Trigger for search vector on blog_posts
DROP TRIGGER IF EXISTS trigger_blog_posts_search_vector ON public.blog_posts;
CREATE TRIGGER trigger_blog_posts_search_vector
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_search_vector();

-- Trigger for category post count
DROP TRIGGER IF EXISTS trigger_category_post_count ON public.blog_posts;
CREATE TRIGGER trigger_category_post_count
  AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_post_count();

-- Trigger for tag post count
DROP TRIGGER IF EXISTS trigger_tag_post_count ON public.blog_post_tags;
CREATE TRIGGER trigger_tag_post_count
  AFTER INSERT OR DELETE ON public.blog_post_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tag_post_count();

-- =============================================
-- 9. Add user_role column to profiles (BEFORE RLS!)
-- =============================================

-- Check if user_role column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_role VARCHAR(20) DEFAULT 'user' CHECK (user_role IN ('user', 'moderator', 'admin'));
  END IF;
END $$;

-- =============================================
-- 10. Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Categories Policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.blog_categories;
CREATE POLICY "Anyone can view active categories"
  ON public.blog_categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Super admin and moderators can manage categories" ON public.blog_categories;
CREATE POLICY "Super admin and moderators can manage categories"
  ON public.blog_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role = 'moderator')
    )
  );

-- Tags Policies
DROP POLICY IF EXISTS "Anyone can view tags" ON public.blog_tags;
CREATE POLICY "Anyone can view tags"
  ON public.blog_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admin and moderators can manage tags" ON public.blog_tags;
CREATE POLICY "Super admin and moderators can manage tags"
  ON public.blog_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role = 'moderator')
    )
  );

-- Posts Policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published' AND published_at <= CURRENT_TIMESTAMP);

DROP POLICY IF EXISTS "Authors can view their own posts" ON public.blog_posts;
CREATE POLICY "Authors can view their own posts"
  ON public.blog_posts FOR SELECT
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Super admin and moderators can view all posts" ON public.blog_posts;
CREATE POLICY "Super admin and moderators can view all posts"
  ON public.blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role = 'moderator')
    )
  );

DROP POLICY IF EXISTS "Super admin and moderators can create posts" ON public.blog_posts;
CREATE POLICY "Super admin and moderators can create posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role = 'moderator')
    )
  );

DROP POLICY IF EXISTS "Authors can update their own posts" ON public.blog_posts;
CREATE POLICY "Authors can update their own posts"
  ON public.blog_posts FOR UPDATE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role = 'moderator')
    )
  );

DROP POLICY IF EXISTS "Super admin can delete posts" ON public.blog_posts;
CREATE POLICY "Super admin can delete posts"
  ON public.blog_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Post Tags Policies
DROP POLICY IF EXISTS "Anyone can view post tags" ON public.blog_post_tags;
CREATE POLICY "Anyone can view post tags"
  ON public.blog_post_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admin and moderators can manage post tags" ON public.blog_post_tags;
CREATE POLICY "Super admin and moderators can manage post tags"
  ON public.blog_post_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role = 'moderator')
    )
  );

-- Comments Policies
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.blog_comments;
CREATE POLICY "Anyone can view approved comments"
  ON public.blog_comments FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.blog_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.blog_comments;
CREATE POLICY "Users can update their own comments"
  ON public.blog_comments FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admin and moderators can manage all comments" ON public.blog_comments;
CREATE POLICY "Super admin and moderators can manage all comments"
  ON public.blog_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role = 'moderator')
    )
  );

-- =============================================
-- 11. Insert Default Categories
-- =============================================

INSERT INTO public.blog_categories (name, slug, description, color, icon) VALUES
('Solar Technology', 'solar-technology', 'Latest innovations and breakthroughs in solar technology', '#FFA500', 'Sun'),
('Industry News', 'industry-news', 'Updates and news from the solar energy industry', '#3B82F6', 'Newspaper'),
('Design Tips', 'design-tips', 'Best practices and tips for solar system design', '#10B981', 'Lightbulb'),
('Case Studies', 'case-studies', 'Real-world solar project implementations and results', '#8B5CF6', 'FileText'),
('Tutorials', 'tutorials', 'Step-by-step guides and how-tos', '#F59E0B', 'BookOpen'),
('Company Updates', 'company-updates', 'BAESS Labs news and product updates', '#EF4444', 'Briefcase')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 12. Insert Default Tags
-- =============================================

INSERT INTO public.blog_tags (name, slug) VALUES
('AI', 'ai'),
('BOQ', 'boq'),
('Financial Analysis', 'financial-analysis'),
('PVWatts', 'pvwatts'),
('String Sizing', 'string-sizing'),
('Energy Simulation', 'energy-simulation'),
('Best Practices', 'best-practices'),
('Tutorial', 'tutorial'),
('Product Update', 'product-update'),
('Industry Trends', 'industry-trends')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE public.blog_posts IS 'Blog posts with full SEO support and featured images';
COMMENT ON TABLE public.blog_categories IS 'Blog post categories for organization';
COMMENT ON TABLE public.blog_tags IS 'Tags for blog posts for better discovery';
COMMENT ON TABLE public.blog_post_tags IS 'Many-to-many relationship between posts and tags';
COMMENT ON TABLE public.blog_comments IS 'User comments on blog posts';
