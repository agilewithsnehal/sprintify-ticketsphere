
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import BoardContainer from '@/components/board/BoardContainer';
import BoardToolbar from '@/components/board/BoardToolbar';
import BoardNotFound from '@/components/board/BoardNotFound';
import BoardSkeleton from '@/components/board/BoardSkeleton';
import { Status } from '@/lib/types';
import { supabaseService } from '@/lib/supabase-service';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import CreateTicketModal from '@/components/CreateTicketModal';

const Board = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { 
    data: board, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      return supabaseService.createBoard(projectId);
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Layout>
        <BoardSkeleton />
      </Layout>
    );
  }

  if (isError || !board) {
    return (
      <Layout>
        <BoardNotFound onBackToProjects={() => navigate('/')} />
      </Layout>
    );
  }

  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    try {
      // Find the ticket in the board
      let foundTicket = null;
      for (const column of board.columns) {
        const ticket = column.tickets.find(t => t.id === ticketId);
        if (ticket) {
          foundTicket = ticket;
          break;
        }
      }
      
      if (!foundTicket) {
        toast.error('Ticket not found');
        return;
      }
      
      // Update ticket status in the database
      await supabaseService.updateTicket(ticketId, { 
        ...foundTicket, 
        status: destinationColumn 
      });
      
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
      
      // Refresh the board data
      refetch();
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
    }
  };

  const handleCreateTicket = async (ticket) => {
    try {
      await supabaseService.createTicket(ticket);
      toast.success('Ticket created successfully');
      refetch();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <BoardToolbar boardName={board.name} onCreateTicket={handleOpenCreateModal} />
        <BoardContainer board={board} onTicketMove={handleTicketMove} />
        
        {isCreateModalOpen && (
          <CreateTicketModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            project={board.project}
            column="todo"
            onTicketCreate={handleCreateTicket}
          />
        )}
      </div>
    </Layout>
  );
};

export default Board;
