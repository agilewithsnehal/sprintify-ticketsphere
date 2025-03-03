
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProjectConfigurationProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ProjectConfiguration: React.FC<ProjectConfigurationProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Project Configuration</DialogTitle>
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
                <span className="text-sm">Members</span>
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
