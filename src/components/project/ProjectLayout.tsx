
import React, { useState } from 'react';
import { Project, Status, Ticket } from '@/lib/types';
import ProjectHeader from '@/components/ProjectHeader';
import ProjectTabs from './ProjectTabs';
import { Button } from '@/components/ui/button';
import { TicketPlus } from 'lucide-react';
import CreateTicketModal from '@/components/CreateTicketModal';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase-service';

interface ProjectLayoutProps {
  project: Project;
  tickets: Ticket[];
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ project, tickets }) => {
  const [activeTab, setActiveTab] = useState('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleTicketCreate = async (newTicket: Ticket): Promise<boolean> => {
    try {
      console.log(`Creating ticket with key: ${newTicket.key}`);
      const createdTicket = await supabaseService.createTicket(newTicket);
      
      if (createdTicket) {
        toast.success('Ticket created successfully');
        // Force a refresh of the tickets
        setTimeout(() => {
          navigate(`/board/${project.id}`);
        }, 500);
        return true;
      } else {
        toast.error('Failed to create ticket');
        return false;
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
      return false;
    }
  };

  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    try {
      console.log(`Moving ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
      
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) {
        toast.error('Ticket not found');
        return;
      }
      
      await supabaseService.updateTicket(ticketId, { ...ticket, status: destinationColumn });
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ProjectHeader 
        project={project} 
        rightContent={
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1"
          >
            <TicketPlus className="h-4 w-4" />
            Create Ticket
          </Button>
        }
      />
      
      <ProjectTabs 
        project={project}
        tickets={tickets}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateTicket={() => setIsCreateModalOpen(true)}
        onTicketMove={handleTicketMove}
      />
      
      {isCreateModalOpen && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          project={project}
          column="todo"
          onTicketCreate={handleTicketCreate}
        />
      )}
    </div>
  );
};

export default ProjectLayout;
