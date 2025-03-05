
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, AlertTriangle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Project } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectConfigurationProps {
  project: Project;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const ProjectConfiguration: React.FC<ProjectConfigurationProps> = ({ 
  project, 
  isOpen = false, 
  onOpenChange 
}) => {
  const [dialogOpen, setDialogOpen] = useState(isOpen);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    onOpenChange?.(open);
  };
  
  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      const success = await supabaseService.deleteProject(project.id);
      
      if (success) {
        toast.success(`Project "${project.name}" has been deleted`);
        setDeleteDialogOpen(false);
        setDialogOpen(false);
        navigate('/');
      } else {
        toast.error('Failed to delete project');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting the project');
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Project Configuration</DialogTitle>
            <DialogDescription>
              Configure settings for {project.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Board Settings</h3>
              <div className="flex flex-col gap-2 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Column Layout</span>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Workflow</span>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Issue Types</span>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Project Details</h3>
              <div className="flex flex-col gap-2 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Members ({project.members.length})</span>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Permissions</span>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <div className="pl-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This action cannot be undone. All tickets and data associated with this project will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the project "{project.name}"? 
              <br /><br />
              This will permanently delete:
              <ul className="list-disc pl-5 mt-2">
                <li>All tickets in this project</li>
                <li>All project settings and configurations</li>
                <li>All project member associations</li>
              </ul>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProject();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectConfiguration;
