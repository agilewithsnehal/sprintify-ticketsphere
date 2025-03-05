
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
      role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
    };
  },
  
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          avatar: updates.avatar
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
        role: data.role as 'admin' | 'manager' | 'developer' | 'viewer'
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  },
  
  async uploadProfileImage(file: File, userId: string): Promise<string | null> {
    try {
      // Create a unique file path for the avatar
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }
      
      // Get the public URL for the uploaded file
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }
};
