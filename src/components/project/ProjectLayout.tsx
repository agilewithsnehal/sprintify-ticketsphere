
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectHeader from '@/components/ProjectHeader';
import ProjectTabs from './ProjectTabs';
import { Project, Ticket, Status } from '@/lib/types';
import CreateTicketModal from '@/components/CreateTicketModal';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase';

interface ProjectLayoutProps {
  project: Project;
  tickets: Ticket[];
  onConfigureClick?: () => void;
  onRefresh?: () => void;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ 
  project, 
  tickets, 
  onConfigureClick,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('board');
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  
  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    console.log('Moving ticket', ticketId, 'from', sourceColumn, 'to', destinationColumn);
    // Implementation for ticket movement would go here
  };
  
  const handleTicketCreate = async (ticket: Ticket) => {
    try {
      console.log('ProjectLayout: Creating ticket in project layout', ticket);
      
      // Create the ticket using the service
      const createdTicket = await supabaseService.createTicket(ticket);
      
      if (!createdTicket) {
        console.error('Failed to create ticket');
        toast.error('Failed to create ticket');
        return false;
      }
      
      console.log('ProjectLayout: Ticket created successfully:', createdTicket);
      toast.success('Ticket created successfully');
      
      // Notify about the ticket creation using the standard event
      document.dispatchEvent(new CustomEvent('ticket-notification', {
        detail: { 
          type: 'created',
          ticketKey: createdTicket.key,
          ticketId: createdTicket.id,
          message: `Ticket ${createdTicket.key} created successfully`
        }
      }));
      
      // Call the refresh callback if provided
      if (onRefresh) {
        console.log('ProjectLayout: Triggering refresh after ticket creation');
        setTimeout(() => onRefresh(), 100);
      }
      
      return true;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
      return false;
    }
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
        onRefresh={onRefresh}
      />
      
      <CreateTicketModal 
        isOpen={createTicketOpen} 
        onClose={() => setCreateTicketOpen(false)} 
        project={project}
        onTicketCreate={handleTicketCreate}
      />
    </div>
  );
};

export default ProjectLayout;
