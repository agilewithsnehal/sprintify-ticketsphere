
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ProjectHeader from '@/components/ProjectHeader';
import CreateTicketModal from '@/components/CreateTicketModal';
import { createBoard, getProjectById } from '@/lib/data';
import { Board as BoardType, Project, Status, Ticket } from '@/lib/types';
import { toast } from 'sonner';

// Import our components
import BoardSkeleton from '@/components/board/BoardSkeleton';
import BoardNotFound from '@/components/board/BoardNotFound';
import BoardToolbar from '@/components/board/BoardToolbar';
import ProjectConfiguration from '@/components/board/ProjectConfiguration';
import BoardContainer from '@/components/board/BoardContainer';

const Board = () => {
  const { projectId = '1' } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const projectData = getProjectById(projectId);
        if (projectData) {
          setProject(projectData);
          setBoard(createBoard(projectId));
        } else {
          toast.error('Project not found');
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        toast.error('Failed to load project data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [projectId]);

  const handleTicketMove = (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    console.log(`Moved ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
    // In a real app, you would call an API to update the ticket status
  };

  const handleTicketCreate = (newTicket: Ticket) => {
    if (board) {
      const updatedBoard = { ...board };
      const column = updatedBoard.columns.find(col => col.id === newTicket.status);
      
      if (column) {
        column.tickets.push(newTicket);
        setBoard(updatedBoard);
        toast.success('Ticket created successfully');
      }
    }
    
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <BoardSkeleton />
      </Layout>
    );
  }

  if (!project || !board) {
    return (
      <Layout>
        <BoardNotFound />
      </Layout>
    );
  }

  return (
    <Layout>
      <ProjectHeader 
        project={project} 
        onConfigureClick={() => setIsConfigModalOpen(true)}
      />
      
      <BoardToolbar 
        boardName={board.name}
        onCreateTicket={() => setIsCreateModalOpen(true)}
      />
      
      <BoardContainer 
        board={board}
        onTicketMove={handleTicketMove}
      />
      
      {isCreateModalOpen && (
        <CreateTicketModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          project={project}
          column="todo" // Default to "todo" status
          onTicketCreate={handleTicketCreate}
        />
      )}

      <ProjectConfiguration 
        isOpen={isConfigModalOpen}
        onOpenChange={setIsConfigModalOpen}
      />
    </Layout>
  );
};

export default Board;
