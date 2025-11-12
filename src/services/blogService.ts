import { supabase } from '@/integrations/supabase/client';

// =============================================
// Types and Interfaces
// =============================================

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  post_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  featured_image_alt?: string;
  author_id: string;
  category_id?: string;
  
  // SEO Fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  
  // Status
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  scheduled_at?: string;
  
  // Metrics
  view_count: number;
  like_count: number;
  comment_count: number;
  read_time_minutes: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Related data (when joined)
  category?: BlogCategory;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  tags?: BlogTag[];
}

export interface BlogPostInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  category_id?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  status?: 'draft' | 'published' | 'archived';
  published_at?: string | null;
  scheduled_at?: string | null;
  read_time_minutes?: number;
  tags?: string[]; // Array of tag IDs
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  status?: 'draft' | 'published' | 'archived';
  author?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// =============================================
// Category Functions
// =============================================

export const getCategories = async (activeOnly = true): Promise<{ data: BlogCategory[]; error: string | null }> => {
  try {
    let query = supabase
      .from('blog_categories')
      .select('*')
      .order('name');
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return { data: [], error: error.message };
  }
};

export const createCategory = async (category: Omit<BlogCategory, 'id' | 'created_at' | 'updated_at' | 'post_count'>): Promise<{ data: BlogCategory | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blog_categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { data: null, error: error.message };
  }
};

export const updateCategory = async (id: string, updates: Partial<BlogCategory>): Promise<{ data: BlogCategory | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blog_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { data: null, error: error.message };
  }
};

export const deleteCategory = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { error: error.message };
  }
};

// =============================================
// Tag Functions
// =============================================

export const getTags = async (): Promise<{ data: BlogTag[]; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return { data: [], error: error.message };
  }
};

export const createTag = async (tag: Omit<BlogTag, 'id' | 'created_at' | 'updated_at' | 'post_count'>): Promise<{ data: BlogTag | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blog_tags')
      .insert([tag])
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating tag:', error);
    return { data: null, error: error.message };
  }
};

export const updateTag = async (id: string, updates: Partial<BlogTag>): Promise<{ data: BlogTag | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blog_tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating tag:', error);
    return { data: null, error: error.message };
  }
};

export const deleteTag = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('blog_tags')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return { error: error.message };
  }
};

// =============================================
// Blog Post Functions
// =============================================

export const getPosts = async (filters: BlogFilters = {}): Promise<{ data: BlogPost[]; error: string | null; count: number }> => {
  try {
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(*),
        author:profiles!author_id(id, name, email, avatar_url)
      `, { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.author) {
      query = query.eq('author_id', filters.author);
    }
    
    if (filters.search) {
      query = query.textSearch('search_vector', filters.search);
    }
    
    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Fetch tags for each post
    const postsWithTags = await Promise.all(
      (data || []).map(async (post) => {
        const { data: tagData } = await supabase
          .from('blog_post_tags')
          .select('tag:blog_tags(*)')
          .eq('post_id', post.id);
        
        return {
          ...post,
          tags: tagData?.map((t: any) => t.tag) || []
        };
      })
    );
    
    return { data: postsWithTags as BlogPost[], error: null, count: count || 0 };
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return { data: [], error: error.message, count: 0 };
  }
};

export const getPostBySlug = async (slug: string): Promise<{ data: BlogPost | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(*),
        author:profiles!author_id(id, name, email, avatar_url)
      `)
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    
    // Fetch tags
    const { data: tagData } = await supabase
      .from('blog_post_tags')
      .select('tag:blog_tags(*)')
      .eq('post_id', data.id);
    
    const post = {
      ...data,
      tags: tagData?.map((t: any) => t.tag) || []
    };
    
    return { data: post as BlogPost, error: null };
  } catch (error: any) {
    console.error('Error fetching post by slug:', error);
    return { data: null, error: error.message };
  }
};

export const getPostById = async (id: string): Promise<{ data: BlogPost | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(*),
        author:profiles!blog_posts_author_id_fkey(id, name, email, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Fetch tags
    const { data: tagData } = await supabase
      .from('blog_post_tags')
      .select('tag:blog_tags(*)')
      .eq('post_id', data.id);
    
    const post = {
      ...data,
      tags: tagData?.map((t: any) => t.tag) || []
    };
    
    return { data: post as BlogPost, error: null };
  } catch (error: any) {
    console.error('Error fetching post by ID:', error);
    return { data: null, error: error.message };
  }
};

export const createPost = async (post: BlogPostInput): Promise<{ data: BlogPost | null; error: string | null }> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }
    
    const { tags, ...postData } = post;
    
    // Create post
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        ...postData,
        author_id: user.user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tagId => ({
        post_id: data.id,
        tag_id: tagId
      }));
      
      await supabase
        .from('blog_post_tags')
        .insert(tagInserts);
    }
    
    return { data: data as BlogPost, error: null };
  } catch (error: any) {
    console.error('Error creating post:', error);
    return { data: null, error: error.message };
  }
};

export const updatePost = async (id: string, updates: Partial<BlogPostInput>): Promise<{ data: BlogPost | null; error: string | null }> => {
  try {
    const { tags, ...postUpdates } = updates;
    
    // Update post
    const { data, error } = await supabase
      .from('blog_posts')
      .update(postUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update tags if provided
    if (tags) {
      // Delete existing tags
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', id);
      
      // Add new tags
      if (tags.length > 0) {
        const tagInserts = tags.map(tagId => ({
          post_id: id,
          tag_id: tagId
        }));
        
        await supabase
          .from('blog_post_tags')
          .insert(tagInserts);
      }
    }
    
    return { data: data as BlogPost, error: null };
  } catch (error: any) {
    console.error('Error updating post:', error);
    return { data: null, error: error.message };
  }
};

export const deletePost = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return { error: error.message };
  }
};

export const incrementViewCount = async (id: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .rpc('increment', {
        table_name: 'blog_posts',
        row_id: id,
        column_name: 'view_count'
      });
    
    if (error) {
      // Fallback if RPC doesn't exist
      const { data } = await supabase
        .from('blog_posts')
        .select('view_count')
        .eq('id', id)
        .single();
      
      if (data) {
        await supabase
          .from('blog_posts')
          .update({ view_count: data.view_count + 1 })
          .eq('id', id);
      }
    }
    
    return { error: null };
  } catch (error: any) {
    console.error('Error incrementing view count:', error);
    return { error: error.message };
  }
};

// =============================================
// Utility Functions
// =============================================

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

export const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes);
};

export const truncateExcerpt = (content: string, maxLength = 160): string => {
  const stripped = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  if (stripped.length <= maxLength) return stripped;
  return stripped.substr(0, maxLength).trim() + '...';
};

