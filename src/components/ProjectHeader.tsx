
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Project } from '@/lib/types';
import { Plus, ChevronDown, Clock, Settings } from 'lucide-react';

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button size="sm" variant="outline" className="gap-1">
            <Clock className="h-4 w-4" />
            <span>Recent</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          <Button size="sm" variant="outline" className="gap-1">
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </Button>
          
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex -space-x-2">
          {project.members.slice(0, 4).map((member) => (
            <motion.div
              key={member.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar className="h-8 w-8 border-2 border-background">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </motion.div>
          ))}
          
          {project.members.length > 4 && (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground text-xs font-medium border-2 border-background">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {project.members.length} team members
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
