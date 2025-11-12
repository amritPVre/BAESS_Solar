import { supabase } from '@/integrations/supabase/client';

// =============================================
// Interfaces
// =============================================

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  display_order: number;
  topic_count: number;
  post_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  topic_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumTopicAuthor {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  slug: string;
  content: string;
  author_id: string;
  category_id: string;
  status: 'open' | 'closed' | 'solved' | 'archived';
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  participant_count: number;
  last_reply_at?: string;
  last_reply_by?: string;
  created_at: string;
  updated_at: string;
  author?: ForumTopicAuthor;
  category?: ForumCategory;
  tags?: ForumTag[];
  participants?: ForumTopicAuthor[];
  last_reply_author?: ForumTopicAuthor;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  parent_reply_id?: string;
  like_count: number;
  is_solution: boolean;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
  author?: ForumTopicAuthor;
  replies?: ForumReply[]; // Nested replies
}

export interface ForumTopicInput {
  title: string;
  slug: string;
  content: string;
  category_id: string;
  status?: 'open' | 'closed' | 'solved' | 'archived';
  is_pinned?: boolean;
  is_featured?: boolean;
  tags?: string[]; // Array of tag IDs
}

export interface ForumReplyInput {
  topic_id: string;
  content: string;
  parent_reply_id?: string | null;
}

export interface ForumTopicFilters {
  category?: string;
  tag?: string;
  status?: 'open' | 'closed' | 'solved' | 'archived';
  search?: string;
  sort?: 'latest' | 'popular' | 'unanswered' | 'solved';
  limit?: number;
  offset?: number;
}

// =============================================
// Forum Topics
// =============================================

export const getTopics = async (filters: ForumTopicFilters = {}) => {
  try {
    let query = supabase
      .from('forum_topics')
      .select(`
        *,
        category:forum_categories(*),
        author:profiles!author_id(id, name, email, avatar_url),
        last_reply_author:profiles!last_reply_by(id, name, email, avatar_url)
      `, { count: 'exact' });

    // Apply filters
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.neq('status', 'archived');
    }

    if (filters.search) {
      query = query.textSearch('search_vector', filters.search);
    }

    // Sorting
    switch (filters.sort) {
      case 'popular':
        query = query.order('like_count', { ascending: false });
        break;
      case 'unanswered':
        query = query.eq('reply_count', 0).order('created_at', { ascending: false });
        break;
      case 'solved':
        query = query.eq('status', 'solved').order('updated_at', { ascending: false });
        break;
      case 'latest':
      default:
        query = query
          .order('is_pinned', { ascending: false })
          .order('is_featured', { ascending: false })
          .order('last_reply_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 25) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching topics:', error);
      return { data: [], error: error.message, count: 0 };
    }

    return { data: data as ForumTopic[], error: null, count: count || 0 };
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return { data: [], error: error.message, count: 0 };
  }
};

export const getTopicBySlug = async (slug: string) => {
  try {
    const { data, error } = await supabase
      .from('forum_topics')
      .select(`
        *,
        category:forum_categories(*),
        author:profiles!author_id(id, name, email, avatar_url),
        last_reply_author:profiles!last_reply_by(id, name, email, avatar_url)
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching topic:', error);
      return { data: null, error: error.message };
    }

    // Fetch tags separately
    const { data: topicTags } = await supabase
      .from('forum_topic_tags')
      .select('tag_id, forum_tags(*)')
      .eq('topic_id', data.id);

    const tags = topicTags?.map(tt => tt.forum_tags).filter(Boolean) as ForumTag[];

    return { data: { ...data, tags } as ForumTopic, error: null };
  } catch (error: any) {
    console.error('Error fetching topic:', error);
    return { data: null, error: error.message };
  }
};

export const createTopic = async (input: ForumTopicInput) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { tags, ...topicData } = input;

    const { data, error } = await supabase
      .from('forum_topics')
      .insert([{ ...topicData, author_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error creating topic:', error);
      return { error: error.message };
    }

    // Add tags
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tag_id => ({ topic_id: data.id, tag_id }));
      await supabase.from('forum_topic_tags').insert(tagInserts);
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error creating topic:', error);
    return { error: error.message };
  }
};

export const updateTopic = async (id: string, input: Partial<ForumTopicInput>) => {
  try {
    const { tags, ...topicData } = input;

    const { error } = await supabase
      .from('forum_topics')
      .update(topicData)
      .eq('id', id);

    if (error) {
      console.error('Error updating topic:', error);
      return { error: error.message };
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase.from('forum_topic_tags').delete().eq('topic_id', id);
      
      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tag_id => ({ topic_id: id, tag_id }));
        await supabase.from('forum_topic_tags').insert(tagInserts);
      }
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error updating topic:', error);
    return { error: error.message };
  }
};

export const deleteTopic = async (id: string) => {
  try {
    const { error } = await supabase
      .from('forum_topics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting topic:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting topic:', error);
    return { error: error.message };
  }
};

export const incrementTopicViewCount = async (id: string) => {
  try {
    await supabase.rpc('increment_topic_view_count', { topic_id_input: id });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

// =============================================
// Forum Replies
// =============================================

export const getReplies = async (topicId: string) => {
  try {
    const { data, error } = await supabase
      .from('forum_replies')
      .select(`
        *,
        author:profiles!author_id(id, name, email, avatar_url)
      `)
      .eq('topic_id', topicId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching replies:', error);
      return { data: [], error: error.message };
    }

    // Build nested replies structure
    const repliesMap = new Map<string, ForumReply>();
    const rootReplies: ForumReply[] = [];

    data.forEach(reply => {
      repliesMap.set(reply.id, { ...reply, replies: [] });
    });

    data.forEach(reply => {
      const replyWithChildren = repliesMap.get(reply.id)!;
      if (reply.parent_reply_id) {
        const parent = repliesMap.get(reply.parent_reply_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(replyWithChildren);
        }
      } else {
        rootReplies.push(replyWithChildren);
      }
    });

    return { data: rootReplies, error: null };
  } catch (error: any) {
    console.error('Error fetching replies:', error);
    return { data: [], error: error.message };
  }
};

export const createReply = async (input: ForumReplyInput) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('forum_replies')
      .insert([{ ...input, author_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error creating reply:', error);
      return { error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating reply:', error);
    return { error: error.message };
  }
};

export const updateReply = async (id: string, content: string) => {
  try {
    const { error } = await supabase
      .from('forum_replies')
      .update({ content, is_edited: true, edited_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating reply:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error updating reply:', error);
    return { error: error.message };
  }
};

export const deleteReply = async (id: string) => {
  try {
    const { error } = await supabase
      .from('forum_replies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reply:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting reply:', error);
    return { error: error.message };
  }
};

export const markAsSolution = async (replyId: string) => {
  try {
    const { error } = await supabase
      .from('forum_replies')
      .update({ is_solution: true })
      .eq('id', replyId);

    if (error) {
      console.error('Error marking as solution:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error marking as solution:', error);
    return { error: error.message };
  }
};

// =============================================
// Likes
// =============================================

export const toggleLike = async (topicId?: string, replyId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check if already liked
    let query = supabase
      .from('forum_likes')
      .select('id')
      .eq('user_id', user.id);

    if (topicId) {
      query = query.eq('topic_id', topicId);
    } else if (replyId) {
      query = query.eq('reply_id', replyId);
    }

    const { data: existing } = await query.single();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('forum_likes')
        .delete()
        .eq('id', existing.id);

      if (error) return { error: error.message };
      return { liked: false, error: null };
    } else {
      // Like
      const { error } = await supabase
        .from('forum_likes')
        .insert([{ user_id: user.id, topic_id: topicId, reply_id: replyId }]);

      if (error) return { error: error.message };
      return { liked: true, error: null };
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return { error: error.message };
  }
};

export const getUserLikes = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('forum_likes')
      .select('topic_id, reply_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user likes:', error);
      return { data: [], error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching user likes:', error);
    return { data: [], error: error.message };
  }
};

// =============================================
// Categories & Tags
// =============================================

export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return { data: [], error: error.message };
    }

    return { data: data as ForumCategory[], error: null };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return { data: [], error: error.message };
  }
};

export const getTags = async () => {
  try {
    const { data, error } = await supabase
      .from('forum_tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tags:', error);
      return { data: [], error: error.message };
    }

    return { data: data as ForumTag[], error: null };
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return { data: [], error: error.message };
  }
};

// =============================================
// Utilities
// =============================================

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export const truncateExcerpt = (content: string, maxLength: number = 200): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

