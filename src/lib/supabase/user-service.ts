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
        avatar: updates.avatar
      };
      
      // Only update avatar_color if there's no avatar or if avatarColor is explicitly set
      if (!updates.avatar || updates.avatarColor) {
        updateData.avatar_color = updates.avatarColor;
      }
      
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
      const filePath = `${fileName}`;

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

      // Update user profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar: publicUrl,
          // Clear the avatar_color when an avatar is set
          avatar_color: null 
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user with avatar:', updateError);
        return null;
      }

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      return null;
    }
  }
};
