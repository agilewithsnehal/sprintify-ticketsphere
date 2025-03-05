
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectHeader from '@/components/ProjectHeader';
import ProjectTabs from './ProjectTabs';
import { Project, Ticket, Status } from '@/lib/types';
import CreateTicketModal from '@/components/CreateTicketModal';
import { toast } from 'sonner';

interface ProjectLayoutProps {
  project: Project;
  tickets: Ticket[];
  onConfigureClick?: () => void;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ project, tickets, onConfigureClick }) => {
  const [activeTab, setActiveTab] = useState('board');
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  
  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    console.log('Moving ticket', ticketId, 'from', sourceColumn, 'to', destinationColumn);
    // Implementation for ticket movement would go here
  };
  
  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <ProjectHeader 
        project={project} 
        ticketCount={tickets.length} 
        onCreateTicket={() => setCreateTicketOpen(true)}
        onConfigureClick={onConfigureClick}
      />
      
      <ProjectTabs 
        project={project}
        tickets={tickets}
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onCreateTicket={() => setCreateTicketOpen(true)}
        onTicketMove={handleTicketMove}
      />
      
      <CreateTicketModal 
        isOpen={createTicketOpen} 
        onClose={() => setCreateTicketOpen(false)} 
        project={project}
        onTicketCreate={() => {
          toast.success('Ticket created successfully');
          return Promise.resolve(true);
        }}
      />
    </div>
  );
};

export default ProjectLayout;
