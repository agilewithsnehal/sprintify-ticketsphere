
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
      console.log('Starting profile image upload for user:', userId);
      
      // Generate a unique filename to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Important: Don't use folders for demo users
      
      console.log('Prepared file path:', filePath);
      
      // Create a public URL with the avatar's location
      console.log('Uploading new file...');
      console.log('File details:', { name: file.name, type: file.type, size: file.size });
      
      // Ensure file type is set correctly
      const contentType = file.type || 'image/jpeg';
      
      // Upload directly to the avatars bucket
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType
        });
      
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return null;
      }
      
      console.log('File uploaded successfully:', data);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('Generated public URL:', publicUrlData.publicUrl);
      
      // Now, update the user record with the new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: publicUrlData.publicUrl })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error updating user avatar URL:', updateError);
        return null;
      }
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }
};
