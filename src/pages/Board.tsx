
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ProjectHeader from '@/components/ProjectHeader';
import CreateTicketModal from '@/components/CreateTicketModal';
import { Board as BoardType, Project, Status, Ticket } from '@/lib/types';
import { toast } from 'sonner';
import { supabaseService } from '@/lib/supabase-service';

// Import our components
import BoardSkeleton from '@/components/board/BoardSkeleton';
import BoardNotFound from '@/components/board/BoardNotFound';
import BoardToolbar from '@/components/board/BoardToolbar';
import ProjectConfiguration from '@/components/board/ProjectConfiguration';
import BoardContainer from '@/components/board/BoardContainer';

const Board = () => {
  const { projectId = '00000000-0000-0000-0000-000000000001' } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const user = await supabaseService.getCurrentUser();
        setCurrentUser(user);
        
        // Get project data
        const projectData = await supabaseService.getProjectById(projectId);
        if (projectData) {
          setProject(projectData);
          
          // Create board from project data
          const boardData = await supabaseService.createBoard(projectId);
          setBoard(boardData);
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

  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    try {
      await supabaseService.updateTicket(ticketId, { status: destinationColumn });
      // Board will be updated via useKanbanBoard which manages the UI state
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
    }
  };

  const handleTicketCreate = async (newTicket: Ticket) => {
    try {
      const createdTicket = await supabaseService.createTicket(newTicket);
      
      if (createdTicket && board) {
        // Update the board with the new ticket
        const updatedBoard = { ...board };
        const column = updatedBoard.columns.find(col => col.id === createdTicket.status);
        
        if (column) {
          column.tickets.push(createdTicket);
          setBoard(updatedBoard);
          toast.success('Ticket created successfully');
        }
      }
      
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
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
