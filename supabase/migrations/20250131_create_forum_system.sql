-- Migration: Create Community Forum System
-- Created: 2025-01-31
-- Description: Complete forum system with categories, topics, replies, and moderation

-- =============================================
-- 1. Forum Categories Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#FFA500',
  icon VARCHAR(50), -- Icon name from lucide-react
  display_order INTEGER DEFAULT 0,
  topic_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. Forum Tags Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.forum_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  topic_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. Forum Topics Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'solved', 'archived')),
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  
  -- Activity tracking
  last_reply_at TIMESTAMP WITH TIME ZONE,
  last_reply_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. Forum Topic Tags (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS public.forum_topic_tags (
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.forum_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, tag_id)
);

-- =============================================
-- 5. Forum Replies Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT false, -- Mark as accepted solution
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderation
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. Forum Likes Table
-- =============================================
CREATE TABLE IF NOT EXISTS public.forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure user can only like a topic or reply once
  CONSTRAINT unique_topic_like UNIQUE (user_id, topic_id),
  CONSTRAINT unique_reply_like UNIQUE (user_id, reply_id),
  CONSTRAINT topic_or_reply CHECK (
    (topic_id IS NOT NULL AND reply_id IS NULL) OR 
    (topic_id IS NULL AND reply_id IS NOT NULL)
  )
);

-- =============================================
-- 7. Forum Participants Table (Track who participated in topics)
-- =============================================
CREATE TABLE IF NOT EXISTS public.forum_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reply_count INTEGER DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (topic_id, user_id)
);

-- =============================================
-- 8. Create Indexes
-- =============================================

-- Topics Indexes
CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON public.forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON public.forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_status ON public.forum_topics(status);
CREATE INDEX IF NOT EXISTS idx_forum_topics_slug ON public.forum_topics(slug);
CREATE INDEX IF NOT EXISTS idx_forum_topics_last_reply ON public.forum_topics(last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned_featured ON public.forum_topics(is_pinned DESC, is_featured DESC, last_reply_at DESC);

-- Replies Indexes
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic ON public.forum_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON public.forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent ON public.forum_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created ON public.forum_replies(created_at DESC);

-- Likes Indexes
CREATE INDEX IF NOT EXISTS idx_forum_likes_user ON public.forum_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_topic ON public.forum_likes(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_reply ON public.forum_likes(reply_id);

-- Participants Indexes
CREATE INDEX IF NOT EXISTS idx_forum_participants_topic ON public.forum_participants(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_participants_user ON public.forum_participants(user_id);

-- Add full-text search for topics
ALTER TABLE public.forum_topics ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', title || ' ' || content)
) STORED;
CREATE INDEX IF NOT EXISTS idx_forum_topics_search ON public.forum_topics USING GIN (search_vector);

-- =============================================
-- 9. Functions & Triggers
-- =============================================

-- Function to update topic reply count
CREATE OR REPLACE FUNCTION public.update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_topics
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.author_id
    WHERE id = NEW.topic_id;
    
    -- Update category post count
    UPDATE public.forum_categories
    SET post_count = post_count + 1
    WHERE id = (SELECT category_id FROM public.forum_topics WHERE id = NEW.topic_id);
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_topics
    SET reply_count = GREATEST(0, reply_count - 1)
    WHERE id = OLD.topic_id;
    
    -- Update category post count
    UPDATE public.forum_categories
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = (SELECT category_id FROM public.forum_topics WHERE id = OLD.topic_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply count
DROP TRIGGER IF EXISTS trigger_update_topic_reply_count ON public.forum_replies;
CREATE TRIGGER trigger_update_topic_reply_count
  AFTER INSERT OR DELETE ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_topic_reply_count();

-- Function to update category topic count
CREATE OR REPLACE FUNCTION public.update_category_topic_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_categories
    SET topic_count = topic_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_categories
    SET topic_count = GREATEST(0, topic_count - 1)
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.category_id IS DISTINCT FROM OLD.category_id THEN
    UPDATE public.forum_categories SET topic_count = GREATEST(0, topic_count - 1) WHERE id = OLD.category_id;
    UPDATE public.forum_categories SET topic_count = topic_count + 1 WHERE id = NEW.category_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for category topic count
DROP TRIGGER IF EXISTS trigger_update_category_topic_count ON public.forum_topics;
CREATE TRIGGER trigger_update_category_topic_count
  AFTER INSERT OR DELETE OR UPDATE OF category_id ON public.forum_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_category_topic_count();

-- Function to update tag topic count
CREATE OR REPLACE FUNCTION public.update_tag_topic_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_tags SET topic_count = topic_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_tags SET topic_count = GREATEST(0, topic_count - 1) WHERE id = OLD.tag_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag topic count
DROP TRIGGER IF EXISTS trigger_update_tag_topic_count ON public.forum_topic_tags;
CREATE TRIGGER trigger_update_tag_topic_count
  AFTER INSERT OR DELETE ON public.forum_topic_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_tag_topic_count();

-- Function to update like counts
CREATE OR REPLACE FUNCTION public.update_forum_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.topic_id IS NOT NULL THEN
      UPDATE public.forum_topics SET like_count = like_count + 1 WHERE id = NEW.topic_id;
    ELSIF NEW.reply_id IS NOT NULL THEN
      UPDATE public.forum_replies SET like_count = like_count + 1 WHERE id = NEW.reply_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.topic_id IS NOT NULL THEN
      UPDATE public.forum_topics SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.topic_id;
    ELSIF OLD.reply_id IS NOT NULL THEN
      UPDATE public.forum_replies SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.reply_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like counts
DROP TRIGGER IF EXISTS trigger_update_forum_like_count ON public.forum_likes;
CREATE TRIGGER trigger_update_forum_like_count
  AFTER INSERT OR DELETE ON public.forum_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_forum_like_count();

-- Function to track participants
CREATE OR REPLACE FUNCTION public.track_forum_participant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.forum_participants (topic_id, user_id, reply_count, last_seen_at)
  VALUES (NEW.topic_id, NEW.author_id, 1, NEW.created_at)
  ON CONFLICT (topic_id, user_id) 
  DO UPDATE SET 
    reply_count = forum_participants.reply_count + 1,
    last_seen_at = NEW.created_at;
  
  -- Update participant count
  UPDATE public.forum_topics
  SET participant_count = (
    SELECT COUNT(DISTINCT user_id) FROM public.forum_participants WHERE topic_id = NEW.topic_id
  )
  WHERE id = NEW.topic_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for participant tracking
DROP TRIGGER IF EXISTS trigger_track_forum_participant ON public.forum_replies;
CREATE TRIGGER trigger_track_forum_participant
  AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.track_forum_participant();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_topic_view_count(topic_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.forum_topics
  SET view_count = view_count + 1
  WHERE id = topic_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. Row Level Security (RLS) Policies
-- =============================================

-- Forum Categories
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.forum_categories;
CREATE POLICY "Allow public read access to categories" ON public.forum_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Allow admin/moderator to manage categories" ON public.forum_categories;
CREATE POLICY "Allow admin/moderator to manage categories" ON public.forum_categories
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))));

-- Forum Tags
ALTER TABLE public.forum_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to tags" ON public.forum_tags;
CREATE POLICY "Allow public read access to tags" ON public.forum_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin/moderator to manage tags" ON public.forum_tags;
CREATE POLICY "Allow admin/moderator to manage tags" ON public.forum_tags
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))));

-- Forum Topics
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to topics" ON public.forum_topics;
CREATE POLICY "Allow public read access to topics" ON public.forum_topics FOR SELECT USING (status != 'archived');
DROP POLICY IF EXISTS "Allow authenticated users to create topics" ON public.forum_topics;
CREATE POLICY "Allow authenticated users to create topics" ON public.forum_topics FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Allow authors to update their own topics" ON public.forum_topics;
CREATE POLICY "Allow authors to update their own topics" ON public.forum_topics FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Allow admin/moderator to manage all topics" ON public.forum_topics;
CREATE POLICY "Allow admin/moderator to manage all topics" ON public.forum_topics
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))));

-- Forum Replies
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to replies" ON public.forum_replies;
CREATE POLICY "Allow public read access to replies" ON public.forum_replies FOR SELECT USING (is_deleted = false);
DROP POLICY IF EXISTS "Allow authenticated users to create replies" ON public.forum_replies;
CREATE POLICY "Allow authenticated users to create replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Allow authors to update their own replies" ON public.forum_replies;
CREATE POLICY "Allow authors to update their own replies" ON public.forum_replies FOR UPDATE USING (auth.uid() = author_id AND is_deleted = false) WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Allow admin/moderator to manage all replies" ON public.forum_replies;
CREATE POLICY "Allow admin/moderator to manage all replies" ON public.forum_replies
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true OR user_role IN ('moderator', 'admin'))));

-- Forum Likes
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to likes" ON public.forum_likes;
CREATE POLICY "Allow public read access to likes" ON public.forum_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to manage their own likes" ON public.forum_likes;
CREATE POLICY "Allow authenticated users to manage their own likes" ON public.forum_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Forum Topic Tags
ALTER TABLE public.forum_topic_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to topic tags" ON public.forum_topic_tags;
CREATE POLICY "Allow public read access to topic tags" ON public.forum_topic_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow topic authors to manage their topic tags" ON public.forum_topic_tags;
CREATE POLICY "Allow topic authors to manage their topic tags" ON public.forum_topic_tags
  FOR ALL USING (EXISTS (SELECT 1 FROM public.forum_topics WHERE id = topic_id AND author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.forum_topics WHERE id = topic_id AND author_id = auth.uid()));

-- Forum Participants
ALTER TABLE public.forum_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to participants" ON public.forum_participants;
CREATE POLICY "Allow public read access to participants" ON public.forum_participants FOR SELECT USING (true);

-- =============================================
-- 11. Default Categories
-- =============================================
INSERT INTO public.forum_categories (name, slug, description, color, icon, display_order)
VALUES
  ('Discussions', 'discussions', 'General discussions about features, workflows, and best practices', '#3B82F6', 'MessageSquare', 1),
  ('Feature Requests', 'feature-requests', 'Suggest new features and improvements', '#10B981', 'Lightbulb', 2),
  ('Bug Reports', 'bug-reports', 'Report bugs and technical issues', '#EF4444', 'Bug', 3),
  ('Feedback', 'feedback', 'Share your feedback and suggestions', '#F59E0B', 'MessageCircle', 4),
  ('Announcements', 'announcements', 'Official announcements and updates from the team', '#8B5CF6', 'Megaphone', 0)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 12. Default Tags
-- =============================================
INSERT INTO public.forum_tags (name, slug, description, color)
VALUES
  ('AI', 'ai', 'Related to AI features', '#8B5CF6'),
  ('BOQ', 'boq', 'Bill of Quantities related', '#3B82F6'),
  ('PV Design', 'pv-design', 'Solar PV design topics', '#10B981'),
  ('UI/UX', 'ui-ux', 'User interface and experience', '#F59E0B'),
  ('Performance', 'performance', 'Performance and optimization', '#EF4444'),
  ('Documentation', 'documentation', 'Documentation related', '#6366F1'),
  ('Integration', 'integration', 'Third-party integrations', '#EC4899')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 13. Comments
-- =============================================
COMMENT ON TABLE public.forum_topics IS 'Forum topics/threads created by users';
COMMENT ON TABLE public.forum_replies IS 'Replies to forum topics';
COMMENT ON TABLE public.forum_categories IS 'Forum categories for organizing topics';
COMMENT ON TABLE public.forum_tags IS 'Tags for forum topics';
COMMENT ON TABLE public.forum_likes IS 'Likes on topics and replies';
COMMENT ON TABLE public.forum_participants IS 'Track users who participated in topics';

