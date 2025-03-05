import { supabase } from "@/integrations/supabase/client";
import { User } from "@/lib/types";

export const supabaseService = {
  async getCurrentUser(): Promise<User> {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      avatar: data.avatar,
      avatarColor: data.avatar_color || 'purple',
      role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
    };
  },
  
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      console.log('Updating user profile:', updates);
      
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          avatar_color: updates.avatarColor
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        avatarColor: data.avatar_color || 'purple',
        role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  },
  
  async uploadProfileImage(file: File, userId: string): Promise<string | null> {
    console.warn('uploadProfileImage is deprecated - using initials with colors instead');
    return null;
  }
};
