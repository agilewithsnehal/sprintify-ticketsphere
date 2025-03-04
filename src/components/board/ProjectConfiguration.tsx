
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Project } from '@/lib/types';

interface ProjectConfigurationProps {
  project: Project; // Added this prop
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const ProjectConfiguration: React.FC<ProjectConfigurationProps> = ({ 
  project, 
  isOpen = false, 
  onOpenChange 
}) => {
  const [dialogOpen, setDialogOpen] = useState(isOpen);
  
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    onOpenChange?.(open);
  };
  
  return (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectConfiguration;
