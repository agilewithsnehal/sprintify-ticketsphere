import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, AlertTriangle, Users, Columns, Calendar, FileText, Shield } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Project, Column } from '@/lib/types';
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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ColumnConfigurationModal from './ColumnConfigurationModal';

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
  const [configureColumnsOpen, setConfigureColumnsOpen] = useState(false);
  const [isSavingColumns, setIsSavingColumns] = useState(false);
  const [columns, setColumns] = useState<Column[] | null>(null);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    onOpenChange?.(open);
  };
  
  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      console.log('Deleting project:', project.id);
      
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

  const handleColumnConfigurationClick = () => {
    const fetchBoardColumns = async () => {
      try {
        const board = await supabaseService.createBoard(project.id);
        if (board && board.columns) {
          setColumns(board.columns);
          setIsColumnConfigOpen(true);
        } else {
          toast.error('Failed to load board columns');
        }
      } catch (error) {
        console.error('Error loading board columns:', error);
        toast.error('Failed to load board columns');
      }
    };
    
    fetchBoardColumns();
  };

  const handleSaveColumns = async (updatedColumns: Column[]) => {
    setIsSaving(true);
    try {
      await supabaseService.updateBoardColumns(project.id, updatedColumns);
      setColumns(updatedColumns);
      toast.success('Board columns updated successfully');
      setIsColumnConfigOpen(false);
    } catch (error) {
      console.error('Error saving columns:', error);
      toast.error('Failed to save board columns');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetColumns = async () => {
    setIsSaving(true);
    try {
      await supabaseService.resetBoardColumns(project.id);
      toast.success('Board columns reset to default');
      setIsColumnConfigOpen(false);
      
      const board = await supabaseService.createBoard(project.id);
      if (board && board.columns) {
        setColumns(board.columns);
      }
    } catch (error) {
      console.error('Error resetting columns:', error);
      toast.error('Failed to reset board columns');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageWorkflow = () => {
    toast.info('Workflow management will be available in a future update');
  };
  
  const handleConfigureIssueTypes = () => {
    toast.info('Issue type configuration will be available in a future update');
  };
  
  const handleManageMembers = () => {
    navigate(`/project/${project.id}?tab=members`);
    setDialogOpen(false);
  };
  
  const handleConfigurePermissions = () => {
    toast.info('Permission configuration will be available in a future update');
  };

  React.useEffect(() => {
    if (configureColumnsOpen && !columns) {
      handleColumnConfigurationClick();
    }
  }, [configureColumnsOpen]);

  if (onOpenChange) {
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleColumnConfigurationClick}
                    >
                      <Columns className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleManageWorkflow}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Issue Types</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleConfigureIssueTypes}
                    >
                      <FileText className="h-4 w-4 mr-2" />
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleManageMembers}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Permissions</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleConfigurePermissions}
                    >
                      <Shield className="h-4 w-4 mr-2" />
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
        
        {/* Column Configuration Modal */}
        {columns && (
          <ColumnConfigurationModal
            isOpen={configureColumnsOpen}
            onOpenChange={setConfigureColumnsOpen}
            columns={columns}
            onSave={handleSaveColumns}
            isSaving={isSavingColumns}
            onReset={handleResetColumns}
            isColumnConfigOpen={isColumnConfigOpen}
          />
        )}
      </>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Board Configuration</CardTitle>
          <CardDescription>
            Customize how your project board functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Column Layout</h3>
                <p className="text-sm text-muted-foreground">
                  Customize the columns that appear on your board
                </p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleColumnConfigurationClick}
              >
                <Columns className="h-4 w-4" />
                Customize
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Workflow</h3>
                <p className="text-sm text-muted-foreground">
                  Define transition rules between ticket statuses
                </p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleManageWorkflow}
              >
                <Calendar className="h-4 w-4" />
                Configure
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Issue Types</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the types of issues that can be created
                </p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleConfigureIssueTypes}
              >
                <FileText className="h-4 w-4" />
                Manage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Project Access</CardTitle>
          <CardDescription>
            Manage team members and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Team Members</h3>
                <p className="text-sm text-muted-foreground">
                  Add or remove people from this project
                </p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleManageMembers}
              >
                <Users className="h-4 w-4" />
                Manage Members
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Configure role-based access control
                </p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleConfigurePermissions}
              >
                <Shield className="h-4 w-4" />
                Set Permissions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-xl text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible and will permanently affect your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Delete Project</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently remove this project and all associated data
                </p>
              </div>
              <Button 
                variant="destructive" 
                className="gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
      
      {/* Column Configuration Modal */}
      {columns && (
        <ColumnConfigurationModal
          isOpen={configureColumnsOpen}
          onOpenChange={setConfigureColumnsOpen}
          columns={columns}
          onSave={handleSaveColumns}
          isSaving={isSavingColumns}
          onReset={handleResetColumns}
          isColumnConfigOpen={isColumnConfigOpen}
        />
      )}
    </div>
  );
};

export default ProjectConfiguration;
