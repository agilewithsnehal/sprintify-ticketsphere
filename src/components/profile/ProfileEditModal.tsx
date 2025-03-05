
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface ProfileEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (updatedUser: User) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdate
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  if (!user) {
    return null;
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create a preview of the selected image
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      let avatarUrl = user.avatar;
      
      // If a new file was selected, upload it
      if (selectedFile) {
        toast.info('Uploading profile image...');
        const uploadedUrl = await supabaseService.uploadProfileImage(selectedFile, user.id);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          toast.error('Failed to upload profile image');
          setIsLoading(false);
          return;
        }
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
      
      toast.info('Updating profile...');
      
      // Update the user profile
      const updatedUser = await supabaseService.updateUserProfile(user.id, {
        name,
        email,
        avatar: avatarUrl
      });
      
      if (updatedUser) {
        toast.success('Profile updated successfully');
        onProfileUpdate(updatedUser);
        onClose();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary/20 cursor-pointer" onClick={triggerFileInput}>
              <AvatarImage src={avatarPreview || undefined} alt={name} />
              <AvatarFallback className="text-xl">{name.substring(0, 2).toUpperCase()}</AvatarFallback>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Upload className="h-8 w-8 text-white" />
              </div>
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">Click to upload a profile image</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="Your name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Your email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={user.role}
              disabled
              className="bg-muted/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;
