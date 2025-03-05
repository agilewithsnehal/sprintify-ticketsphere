
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (updatedUser: User) => void;
}

// Available background colors for avatars
const avatarColors = {
  'purple': '#9b87f5',
  'blue': '#0EA5E9',
  'green': '#10B981',
  'orange': '#F97316',
  'pink': '#D946EF',
  'gray': '#8E9196',
  'red': '#F43F5E',
  'yellow': '#F59E0B',
};

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdate
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarColor, setAvatarColor] = useState<string>(user?.avatarColor || 'purple');
  
  if (!user) {
    return null;
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handleColorChange = (color: string) => {
    setAvatarColor(color);
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
      
      toast.info('Updating profile...');
      
      // Update the user profile with the selected avatar color
      const updatedUser = await supabaseService.updateUserProfile(user.id, {
        name,
        email,
        avatarColor
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
            <Avatar 
              className="h-24 w-24 border-2 border-primary/20" 
              style={{ backgroundColor: avatarColors[avatarColor as keyof typeof avatarColors] || '#9b87f5' }}
            >
              <AvatarFallback className="text-xl font-bold text-black">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="w-full max-w-xs">
              <Label htmlFor="avatarColor" className="mb-2 block">Avatar Color</Label>
              <Select value={avatarColor} onValueChange={handleColorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(avatarColors).map(([colorName, colorValue]) => (
                    <SelectItem key={colorName} value={colorName}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-4 w-4 rounded-full" 
                          style={{ backgroundColor: colorValue }}
                        />
                        <span className="capitalize">{colorName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
