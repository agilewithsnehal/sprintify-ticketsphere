
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

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
      
      // Update the database record with the correct field name (snake_case)
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          avatar_color: updates.avatarColor,
          avatar: updates.avatar
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }
      
      // Transform the response to match our User type (camelCase)
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
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${uuidv4()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      // Get the public URL for the uploaded file
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Update user profile with the new avatar URL
      await supabase
        .from('users')
        .update({ avatar: publicUrl })
        .eq('id', userId);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      return null;
    }
  }
};
