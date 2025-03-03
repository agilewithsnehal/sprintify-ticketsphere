
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabaseService } from '@/lib/supabase-service';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  
  // Fetch current user for the project creation
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await supabaseService.getCurrentUser(),
  });

  // Initialize form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
    },
  });

  const onSubmit = async (values: ProjectFormValues) => {
    if (!currentUser) {
      toast.error('Unable to create project: current user not found');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare project data
      const newProject = {
        name: values.name,
        description: values.description || '',
        key: values.key,
        lead: currentUser,
        members: [currentUser], // Start with current user as the only member
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
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
