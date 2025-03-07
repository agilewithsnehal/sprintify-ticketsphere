
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/lib/supabase';
import { User } from '@/lib/types';
import { toast } from 'sonner';
import ProfileForm from '@/components/profile/ProfileForm';

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await supabaseService.getCurrentUser(),
    staleTime: 0, // Force refetch every time to ensure we have the latest data
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) return null;
      return await supabaseService.updateUserProfile(user.id, updates);
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['currentUser'], data);
        queryClient.invalidateQueries({ queryKey: ['currentUser'] }); // Ensure all currentUser queries are invalidated
        toast.success('Profile updated successfully');
      }
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  });

  const uploadProfileImage = useMutation({
    mutationFn: async (file: File) => {
      if (!user) return null;
      
      // Upload the image file
      const avatarUrl = await supabaseService.uploadProfileImage(file, user.id);
      
      // If the upload was successful, update the user profile with the new URL
      if (avatarUrl) {
        return await supabaseService.updateUserProfile(user.id, {
          avatar: avatarUrl,
          avatarColor: null // Clear avatar color when setting an image
        });
      }
      return null;
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        // Update the local user data with the new information
        queryClient.setQueryData(['currentUser'], updatedUser);
        toast.success('Profile picture updated successfully');
      } else {
        toast.error('Failed to update profile image');
      }
    },
    onError: (error) => {
      toast.error('Failed to upload profile image');
      console.error('Error uploading profile image:', error);
      
      // Invalidate the query to refresh the user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });
  
  const deleteProfileImage = useMutation({
    mutationFn: async () => {
      if (!user) return false;
      return await supabaseService.deleteProfileImage(user.id);
    },
    onSuccess: (success) => {
      if (success) {
        // Refetch the user data to get the updated profile
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        toast.success('Profile picture removed successfully');
      } else {
        toast.error('Failed to remove profile picture');
      }
    },
    onError: (error) => {
      toast.error('Failed to remove profile picture');
      console.error('Error removing profile image:', error);
      
      // Invalidate the query to refresh the user data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleUpdateProfile = (formData: Partial<User>) => {
    updateProfile.mutate(formData);
  };

  const handleImageUpload = async (file: File) => {
    await uploadProfileImage.mutateAsync(file);
  };
  
  const handleImageDelete = async () => {
    await deleteProfileImage.mutateAsync();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="h-[400px] flex items-center justify-center">
            <p>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <ProfileForm 
                  user={user} 
                  onSubmit={handleUpdateProfile} 
                  onImageUpload={handleImageUpload}
                  onImageDelete={handleImageDelete}
                  isLoading={updateProfile.isPending || uploadProfileImage.isPending || deleteProfileImage.isPending} 
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
