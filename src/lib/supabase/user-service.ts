
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
      
      // If there's an avatar and no avatarColor provided, keep the existing avatarColor
      const updateData: any = {
        name: updates.name,
        email: updates.email,
      };
      
      // Handle avatar and avatar_color updates
      if (updates.avatar !== undefined) {
        updateData.avatar = updates.avatar;
      }
      
      if (updates.avatarColor !== undefined) {
        updateData.avatar_color = updates.avatarColor;
      }
      
      console.log('Update data being sent to Supabase:', updateData);
      
      // Update the database record with the correct field name (snake_case)
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }
      
      console.log('Updated user data from DB:', data);
      
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
      const filePath = fileName;

      console.log('Uploading profile image:', filePath);

      // Upload the file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      console.log('Upload successful, data:', uploadData);

      // Get the public URL for the uploaded file
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      console.log('Public URL:', publicUrl);

      // Return the URL, but we'll update the user profile separately
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      return null;
    }
  },
  
  async deleteProfileImage(userId: string): Promise<boolean> {
    try {
      // First, get the current user to find the avatar URL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('avatar')
        .eq('id', userId)
        .single();
        
      if (userError || !userData.avatar) {
        console.error('Error getting user avatar:', userError);
        return false;
      }
      
      // Extract the file name from the URL
      const avatarUrl = userData.avatar;
      const fileName = avatarUrl.split('/').pop();
      
      if (!fileName) {
        console.error('Invalid avatar URL format');
        return false;
      }
      
      console.log('Deleting avatar file:', fileName);
      
      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([fileName]);
        
      if (deleteError) {
        console.error('Error deleting avatar file:', deleteError);
        // Continue anyway to update the user record
      }
      
      // Update the user record to remove the avatar and set a default avatar color
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar: null, 
          avatar_color: 'purple' 
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user after avatar deletion:', updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteProfileImage:', error);
      return false;
    }
  }
};
