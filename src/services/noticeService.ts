import { supabase } from "@/integrations/supabase/client";

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'event' | 'webinar' | 'training' | 'feature_update' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_active: boolean;
  published_date: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNoticeData {
  title: string;
  content: string;
  type: Notice['type'];
  priority?: Notice['priority'];
  is_active?: boolean;
  expires_at?: string | null;
}

export const noticeService = {
  // Get all active notices
  async getActiveNotices(): Promise<Notice[]> {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('published_date', { ascending: false });

    if (error) {
      console.error('Error fetching notices:', error);
      throw error;
    }

    return data || [];
  },

  // Get all notices (admin only)
  async getAllNotices(): Promise<Notice[]> {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('published_date', { ascending: false });

    if (error) {
      console.error('Error fetching all notices:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new notice (admin only)
  async createNotice(noticeData: CreateNoticeData): Promise<Notice> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('notices')
      .insert({
        ...noticeData,
        created_by: userData.user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notice:', error);
      throw error;
    }

    return data;
  },

  // Update a notice (admin only)
  async updateNotice(id: string, updates: Partial<CreateNoticeData>): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notice:', error);
      throw error;
    }

    return data;
  },

  // Delete a notice (admin only)
  async deleteNotice(id: string): Promise<void> {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notice:', error);
      throw error;
    }
  },

  // Toggle notice active status (admin only)
  async toggleNoticeStatus(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase
      .from('notices')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      console.error('Error toggling notice status:', error);
      throw error;
    }
  },
};

