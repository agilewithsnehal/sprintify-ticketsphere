
import React from 'react';
import { Project } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectSelectProps {
  projectId: string;
  projects: Project[];
  onProjectChange: (projectId: string) => void;
  disabled?: boolean;
}

export const ProjectSelect: React.FC<ProjectSelectProps> = ({
  projectId,
  projects,
  onProjectChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor="project" className="text-sm font-medium">Project</label>
      <Select 
        value={projectId} 
        onValueChange={onProjectChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name} ({project.key})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
