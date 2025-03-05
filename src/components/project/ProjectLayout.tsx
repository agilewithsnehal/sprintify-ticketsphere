import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectHeader from '@/components/ProjectHeader';
import ProjectTabs from './ProjectTabs';
import KanbanBoardWrapper from '@/components/board/KanbanBoardWrapper';
import { Project, Ticket } from '@/lib/types';
import CreateTicketModal from '@/components/CreateTicketModal';

interface ProjectLayoutProps {
  project: Project;
  tickets: Ticket[];
  onConfigureClick?: () => void;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ project, tickets, onConfigureClick }) => {
  const [activeTab, setActiveTab] = useState('board');
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  
  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <ProjectHeader 
        project={project} 
        ticketCount={tickets.length} 
        onCreateTicket={() => setCreateTicketOpen(true)}
        onConfigureClick={onConfigureClick}
      />
      
      <ProjectTabs activeTab={activeTab} onChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'board' && (
          <KanbanBoardWrapper project={project} />
        )}
        
        {/* Render other tabs based on activeTab */}
      </div>
      
      <CreateTicketModal 
        isOpen={createTicketOpen} 
        onClose={() => setCreateTicketOpen(false)} 
        defaultProjectId={project.id}
      />
    </div>
  );
};

export default ProjectLayout;
