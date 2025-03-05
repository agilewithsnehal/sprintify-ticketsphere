
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabaseService } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User } from '@/lib/types';

// Define the form schema
const projectFormSchema = z.object({
  name: z.string().min(2, { message: 'Project name must be at least 2 characters' }),
  key: z.string().min(2, { message: 'Project key must be at least 2 characters' })
    .max(10, { message: 'Project key must be at most 10 characters' })
    .regex(/^[A-Z0-9]+$/, { message: 'Project key must be uppercase letters and numbers only' }),
  description: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectModal = ({ isOpen, onClose }: ProjectModalProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Fetch current user for the project creation
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await supabaseService.getCurrentUser(),
  });

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load available users');
      }
    };

    if (!isLoadingCurrentUser) {
      fetchUsers();
    }
  }, [isLoadingCurrentUser]);

  // Helper function to get all users (simulated for now)
  const getAllUsers = async (): Promise<User[]> => {
    // Filter out the current user so we don't add them twice
    const dummyUsers: User[] = [
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'developer'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'manager'
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Sarah Lee',
        email: 'sarah@example.com',
        role: 'developer'
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'Sam Parker',
        email: 'sam@clarity.com',
        role: 'manager',
        avatar: '/lovable-uploads/3b7d4019-3c88-4844-90ce-254bd96fcd58.png'
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        name: 'Taylor Chen',
        email: 'taylor@clarity.com',
        role: 'developer',
        avatar: '/lovable-uploads/3b7d4019-3c88-4844-90ce-254bd96fcd58.png'
      }
    ];
    
    let allUsers = [...dummyUsers];
    
    // Add current user if available
    if (currentUser) {
      // Make sure we don't add duplicates
      if (!allUsers.some(u => u.id === currentUser.id)) {
        allUsers = [currentUser, ...allUsers];
      }
    }
    
    return allUsers;
  };

  // Initialize form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
    },
  });

  // Set the current user as initially selected
  useEffect(() => {
    if (currentUser) {
      setSelectedUserIds(prev => {
        // If current user is not in the selection yet, add them
        if (!prev.includes(currentUser.id)) {
          return [...prev, currentUser.id];
        }
        return prev;
      });
    }
  }, [currentUser]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      // If current user, don't allow deselection
      if (userId === currentUser?.id) {
        return prev;
      }
      
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const onSubmit = async (values: ProjectFormValues) => {
    if (!currentUser) {
      toast.error('Unable to create project: current user not found');
      return;
    }

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one team member');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure current user is in the selected members
      let finalSelectedIds = [...selectedUserIds];
      if (!finalSelectedIds.includes(currentUser.id)) {
        finalSelectedIds.push(currentUser.id);
      }

      // Get the selected users
      const selectedMembers = availableUsers.filter(user => 
        finalSelectedIds.includes(user.id)
      );
      
      // Add the current user if not in selected members
      if (!selectedMembers.some(member => member.id === currentUser.id)) {
        selectedMembers.push(currentUser);
      }

      // Prepare project data
      const newProject = {
        name: values.name,
        description: values.description || '',
        key: values.key,
        lead: currentUser,
        members: selectedMembers, // Use selected members with current user guaranteed
      };
      
      // Create the project
      const project = await supabaseService.createProject(newProject);
      
      if (project) {
        toast.success(`Project ${project.name} created successfully`);
        onClose();
        navigate(`/project/${project.id}`);
      } else {
        toast.error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('An error occurred while creating the project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your workspace.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Key</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="PRJ" 
                      {...field} 
                      value={field.value.toUpperCase()}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this project is about" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Team Members Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Members</label>
              <ScrollArea className="h-[150px] border rounded-md p-2">
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                      <Checkbox 
                        id={`user-${user.id}`}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        disabled={user.id === currentUser?.id} // Current user is always selected
                      />
                      <label 
                        htmlFor={`user-${user.id}`}
                        className={`text-sm cursor-pointer flex-1 flex justify-between ${
                          user.id === currentUser?.id ? 'font-semibold' : ''
                        }`}
                      >
                        <span>{user.name}{user.id === currentUser?.id ? ' (You)' : ''}</span>
                        <span className="text-muted-foreground">{user.role}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {currentUser && (
                <p className="text-xs text-muted-foreground">You are automatically added to this project.</p>
              )}
            </div>
            
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
