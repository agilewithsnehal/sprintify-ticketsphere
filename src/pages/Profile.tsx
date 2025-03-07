
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
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user) return null;
      return await supabaseService.updateUserProfile(user.id, updates);
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['currentUser'], data);
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
      return await supabaseService.uploadProfileImage(file, user.id);
    },
    onSuccess: (avatarUrl) => {
      if (avatarUrl) {
        // After successful upload, update the query data directly to show the new avatar
        // and remove the avatar color since we now have an image
        queryClient.setQueryData(['currentUser'], (oldData: User) => ({
          ...oldData,
          avatar: avatarUrl,
          avatarColor: null
        }));
        
        toast.success('Profile picture updated successfully');
        
        // Refetch the user to ensure we have the latest data
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      } else {
        toast.error('Failed to update profile image');
      }
    },
    onError: (error) => {
      toast.error('Failed to upload profile image');
      console.error('Error uploading profile image:', error);
    }
  });

  const handleUpdateProfile = (formData: Partial<User>) => {
    updateProfile.mutate(formData);
  };

  const handleImageUpload = async (file: File) => {
    await uploadProfileImage.mutateAsync(file);
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
                  isLoading={updateProfile.isPending || uploadProfileImage.isPending} 
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
