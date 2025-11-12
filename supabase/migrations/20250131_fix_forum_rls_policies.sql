-- Fix RLS policies for forum system
-- This fixes the 403 error when creating replies

-- =============================================
-- 1. Fix forum_participants RLS policies
-- =============================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view participants" ON public.forum_participants;
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.forum_participants;

-- Allow anyone to read participants
CREATE POLICY "Anyone can view participants"
  ON public.forum_participants
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their participation
-- This is needed for the trigger function to work
CREATE POLICY "Authenticated users can insert participation"
  ON public.forum_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. Fix forum_replies RLS policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view non-deleted replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can update their own replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Users can delete their own replies" ON public.forum_replies;
DROP POLICY IF EXISTS "Moderators can manage all replies" ON public.forum_replies;

-- Allow anyone to read non-deleted replies
CREATE POLICY "Anyone can view non-deleted replies"
  ON public.forum_replies
  FOR SELECT
  USING (is_deleted = false);

-- Allow authenticated users to create replies
CREATE POLICY "Authenticated users can create replies"
  ON public.forum_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own replies
CREATE POLICY "Users can update their own replies"
  ON public.forum_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow users to soft delete their own replies (set is_deleted = true)
CREATE POLICY "Users can delete their own replies"
  ON public.forum_replies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow moderators to manage all replies
CREATE POLICY "Moderators can manage all replies"
  ON public.forum_replies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role IN ('admin', 'moderator'))
    )
  );

-- =============================================
-- 3. Fix forum_topics RLS policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view non-archived topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Authenticated users can create topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Users can update their own topics" ON public.forum_topics;
DROP POLICY IF EXISTS "Moderators can manage all topics" ON public.forum_topics;

-- Allow anyone to read non-archived topics
CREATE POLICY "Anyone can view non-archived topics"
  ON public.forum_topics
  FOR SELECT
  USING (status != 'archived');

-- Allow authenticated users to create topics
CREATE POLICY "Authenticated users can create topics"
  ON public.forum_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own topics
CREATE POLICY "Users can update their own topics"
  ON public.forum_topics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow moderators to manage all topics
CREATE POLICY "Moderators can manage all topics"
  ON public.forum_topics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role IN ('admin', 'moderator'))
    )
  );

-- =============================================
-- 4. Fix forum_likes RLS policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all likes" ON public.forum_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.forum_likes;
DROP POLICY IF EXISTS "Users can unlike their own" ON public.forum_likes;

-- Allow anyone to view likes
CREATE POLICY "Users can view all likes"
  ON public.forum_likes
  FOR SELECT
  USING (true);

-- Allow authenticated users to like (insert)
CREATE POLICY "Authenticated users can like"
  ON public.forum_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to unlike (delete their own likes)
CREATE POLICY "Users can unlike their own"
  ON public.forum_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 5. Ensure categories and tags are publicly readable
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Anyone can view tags" ON public.forum_tags;
DROP POLICY IF EXISTS "Moderators can manage categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Moderators can manage tags" ON public.forum_tags;

-- Allow anyone to read active categories
CREATE POLICY "Anyone can view active categories"
  ON public.forum_categories
  FOR SELECT
  USING (is_active = true);

-- Allow anyone to read tags
CREATE POLICY "Anyone can view tags"
  ON public.forum_tags
  FOR SELECT
  USING (true);

-- Allow moderators to manage categories
CREATE POLICY "Moderators can manage categories"
  ON public.forum_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role IN ('admin', 'moderator'))
    )
  );

-- Allow moderators to manage tags
CREATE POLICY "Moderators can manage tags"
  ON public.forum_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role IN ('admin', 'moderator'))
    )
  );

-- =============================================
-- 6. Fix forum_topic_tags RLS policy
-- =============================================

DROP POLICY IF EXISTS "Anyone can view topic tags" ON public.forum_topic_tags;
DROP POLICY IF EXISTS "Topic authors can manage their topic tags" ON public.forum_topic_tags;

-- Allow anyone to view topic tags
CREATE POLICY "Anyone can view topic tags"
  ON public.forum_topic_tags
  FOR SELECT
  USING (true);

-- Allow topic authors to manage their topic tags
CREATE POLICY "Topic authors can manage their topic tags"
  ON public.forum_topic_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_topics
      WHERE forum_topics.id = forum_topic_tags.topic_id
      AND forum_topics.author_id = auth.uid()
    )
  );

-- Moderators can manage all topic tags
CREATE POLICY "Moderators can manage all topic tags"
  ON public.forum_topic_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_super_admin = true OR profiles.user_role IN ('admin', 'moderator'))
    )
  );

-- =============================================
-- Summary
-- =============================================
-- This migration fixes the RLS policies to:
-- 1. Allow authenticated users to reply to topics
-- 2. Allow the trigger to track participants
-- 3. Allow users to like/unlike topics and replies
-- 4. Allow topic authors to edit their own topics
-- 5. Allow moderators to manage all content

