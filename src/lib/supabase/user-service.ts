
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
      // Create a simple file path - using just the original filename
      const fileName = file.name;
      const filePath = `${userId}/${fileName}`;
      
      // First, check if we need to delete an existing file
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);
        
      // Remove any existing files in the folder to avoid accumulating files
      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map(f => `${userId}/${f.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToRemove);
      }
      
      // Upload the new file
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }
};
