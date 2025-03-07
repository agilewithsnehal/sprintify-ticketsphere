
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

const avatarColors = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 
  'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

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
  isLoading: boolean;
}

const ProfileForm = ({ user, onSubmit, onImageUpload, isLoading }: ProfileFormProps) => {
  const [uploadLoading, setUploadLoading] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email || '',
      avatarColor: user.avatarColor || 'purple',
    },
  });

  const handleSubmit = (values: ProfileFormValues) => {
    onSubmit({
      name: values.name,
      email: values.email,
      avatarColor: values.avatarColor,
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploadLoading(true);
      await onImageUpload(file);
      toast.success('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadLoading(false);
    }
  };

  const selectedColor = form.watch('avatarColor');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className={`bg-${selectedColor}-500 text-white text-xl`}>
              {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-2">
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
                disabled={uploadLoading}
              />
            </label>
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

        <FormField
          control={form.control}
          name="avatarColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar Color</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-2"
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
                        className={`h-8 w-8 rounded-full cursor-pointer ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-black dark:peer-data-[state=checked]:ring-white bg-${color}-500`}
                      />
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading || uploadLoading}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;
