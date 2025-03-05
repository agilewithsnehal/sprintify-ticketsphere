
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
      const filePath = `${userId}/${fileName}`;
      
      console.log('Prepared file path:', filePath);
      
      // First check if the user folder exists and remove any existing files
      try {
        console.log('Checking for existing files...');
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('avatars')
          .list(userId);
        
        if (listError) {
          console.log('Error listing files:', listError);
        } else {
          console.log('Existing files:', existingFiles);
        }
        
        // Remove existing files if any
        if (existingFiles && existingFiles.length > 0) {
          console.log('Found existing files to remove:', existingFiles.length);
          const filesToRemove = existingFiles.map(f => `${userId}/${f.name}`);
          const { error: removeError } = await supabase.storage
            .from('avatars')
            .remove(filesToRemove);
            
          if (removeError) {
            console.log('Error removing old files:', removeError);
          } else {
            console.log('Successfully removed old files');
          }
        } else {
          console.log('No existing files found');
        }
      } catch (listError) {
        console.error('Error managing existing files:', listError);
        // Continue with upload even if cleaning fails
      }
      
      // Upload the new file with explicit content type
      console.log('Uploading new file...');
      console.log('File details:', { name: file.name, type: file.type, size: file.size });
      
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
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
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  }
};
