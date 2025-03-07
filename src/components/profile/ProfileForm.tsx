
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

// Light pastel colors for avatar backgrounds
const avatarColors = [
  'bg-cyan-100', 'bg-blue-100', 'bg-indigo-100', 
  'bg-purple-100', 'bg-pink-100', 'bg-rose-100'
];

// Text colors that contrast well with the backgrounds
const textColors = {
  'bg-cyan-100': 'text-cyan-700',
  'bg-blue-100': 'text-blue-700',
  'bg-indigo-100': 'text-indigo-700',
  'bg-purple-100': 'text-purple-700',
  'bg-pink-100': 'text-pink-700',
  'bg-rose-100': 'text-rose-700'
};

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  avatarColor: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: User;
  onSubmit: (values: Partial<User>) => void;
  onImageUpload: (file: File) => Promise<void>;
  onImageDelete?: () => Promise<void>;
  isLoading: boolean;
}

const ProfileForm = ({ user, onSubmit, onImageUpload, onImageDelete, isLoading }: ProfileFormProps) => {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(user.avatar || null);
  const [displayName, setDisplayName] = useState(user.name || '');
  
  // Update the current avatar when the user prop changes
  useEffect(() => {
    setCurrentAvatar(user.avatar || null);
    setDisplayName(user.name || '');
  }, [user.avatar, user.name]);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      avatarColor: user.avatarColor ? `bg-${user.avatarColor}-100` : 'bg-purple-100',
    },
  });

  // Get user initials based on name
  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    
    // Split the name and take the first letter of each part
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      // If only one name part, take the first two letters or just the first letter
      return name.substring(0, Math.min(2, name.length)).toUpperCase();
    } else {
      // If multiple name parts, take first letter of first and last parts
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
  };

  const handleSubmit = (values: ProfileFormValues) => {
    // Convert the color class back to the format expected by the API
    const colorName = values.avatarColor?.replace('bg-', '').replace('-100', '');
    
    setDisplayName(values.name); // Update the display name immediately
    
    onSubmit({
      name: values.name,
      email: values.email,
      avatarColor: colorName,
    });
  };

  // Watch for changes in the name field to update initials in real-time
  const watchedName = form.watch('name');
  useEffect(() => {
    setDisplayName(watchedName || ''); // Ensure we never pass undefined
  }, [watchedName]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploadLoading(true);
      // Create a preview URL for the UI
      const previewUrl = URL.createObjectURL(file);
      setCurrentAvatar(previewUrl);
      
      // Upload the image
      await onImageUpload(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
      // Revert to previous avatar if upload fails
      setCurrentAvatar(user.avatar);
    } finally {
      setUploadLoading(false);
    }
  };
  
  const handleImageDelete = async () => {
    if (!onImageDelete) return;
    
    try {
      setDeleteLoading(true);
      setCurrentAvatar(null); // Immediately remove from UI
      await onImageDelete();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete profile picture');
      // Revert to previous avatar if delete fails
      setCurrentAvatar(user.avatar);
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedColor = form.watch('avatarColor');
  const hasAvatar = !!currentAvatar;
  const textColorClass = textColors[selectedColor as keyof typeof textColors] || 'text-gray-700';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4 border border-gray-200">
            <AvatarImage src={currentAvatar || ''} alt={displayName} />
            <AvatarFallback className={`${selectedColor} ${textColorClass} text-xl`}>
              {getUserInitials(displayName || '')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex gap-2 mt-2">
            <label htmlFor="profile-image" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-primary p-2 border border-dashed border-gray-300 rounded-md hover:bg-accent">
                <UploadCloud size={16} />
                <span>{uploadLoading ? 'Uploading...' : 'Upload new picture'}</span>
              </div>
              <input 
                id="profile-image" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
                disabled={uploadLoading || deleteLoading}
              />
            </label>
            
            {hasAvatar && onImageDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                size="sm"
                onClick={handleImageDelete}
                disabled={uploadLoading || deleteLoading}
                className="flex items-center gap-1 text-sm p-2"
              >
                <Trash size={16} />
                {deleteLoading ? 'Deleting...' : 'Remove'}
              </Button>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!hasAvatar && (
          <FormField
            control={form.control}
            name="avatarColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar Background</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-3 py-2"
                  >
                    {avatarColors.map((color) => (
                      <div key={color} className="flex items-center">
                        <RadioGroupItem
                          value={color}
                          id={`color-${color}`}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={`color-${color}`}
                          className={`h-10 w-10 rounded-full cursor-pointer ring-offset-background transition-colors border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-black dark:peer-data-[state=checked]:ring-white ${color} flex items-center justify-center`}
                        >
                          <span className={textColors[color as keyof typeof textColors]}>
                            {getUserInitials(displayName || '')}
                          </span>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isLoading || uploadLoading || deleteLoading}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;
