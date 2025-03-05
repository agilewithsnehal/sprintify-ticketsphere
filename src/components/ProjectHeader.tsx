
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Project } from '@/lib/types';
import { Plus, ChevronDown, Clock, Settings } from 'lucide-react';

// Avatar color mapping
const avatarColors = {
  'purple': '#9b87f5',
  'blue': '#0EA5E9',
  'green': '#10B981',
  'orange': '#F97316',
  'pink': '#D946EF',
  'gray': '#8E9196',
  'red': '#F43F5E',
  'yellow': '#F59E0B',
};

interface ProjectHeaderProps {
  project: Project;
  ticketCount?: number;
  onCreateTicket?: () => void;
  onConfigureClick?: () => void;
  rightContent?: React.ReactNode;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
  project, 
  ticketCount, 
  onCreateTicket, 
  onConfigureClick,
  rightContent 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (id: string) => {
    // Use the character codes in the id to select a color
    const colorKeys = Object.keys(avatarColors);
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorKeys.length;
    return avatarColors[colorKeys[index] as keyof typeof avatarColors];
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {!rightContent ? (
            <>
              <Button size="sm" variant="outline" className="gap-1">
                <Clock className="h-4 w-4" />
                <span>Recent</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1"
                onClick={onConfigureClick}
              >
                <Settings className="h-4 w-4" />
                <span>Configure</span>
              </Button>
              
              <Button 
                size="sm" 
                className="gap-1"
                onClick={onCreateTicket}
              >
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </Button>
            </>
          ) : (
            rightContent
          )}
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
              <Avatar 
                className="h-8 w-8 border-2 border-background"
                style={{ 
                  backgroundColor: member.avatarColor 
                    ? avatarColors[member.avatarColor as keyof typeof avatarColors] 
                    : getRandomColor(member.id) 
                }}
              >
                <AvatarFallback className="text-white text-xs">
                  {getInitials(member.name)}
                </AvatarFallback>
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
          {ticketCount !== undefined && (
            <span className="ml-2">• {ticketCount} tickets</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
