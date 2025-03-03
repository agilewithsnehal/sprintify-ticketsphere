
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
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  
  const { 
    data: board, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const boardData = await supabaseService.createBoard(projectId);
      console.log('Board data loaded:', boardData);
      return boardData;
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    console.log('Board component mounted with projectId:', projectId);
  }, [projectId]);

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
        <BoardNotFound />
      </Layout>
    );
  }

  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    try {
      console.log(`Moving ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
      
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
      console.log('Creating new ticket:', ticket);
      const result = await supabaseService.createTicket(ticket);
      if (result) {
        toast.success('Ticket created successfully');
        refetch();
      } else {
        toast.error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    } finally {
      setIsCreateModalOpen(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // Add new handlers for filter and group buttons
  const handleFilterClick = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
    toast.info('Filter functionality coming soon');
  };

  const handleGroupClick = () => {
    setIsGroupMenuOpen(!isGroupMenuOpen);
    toast.info('Group functionality coming soon');
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <BoardToolbar 
          boardName={board.name} 
          onCreateTicket={handleOpenCreateModal}
          onFilterClick={handleFilterClick}
          onGroupClick={handleGroupClick}
        />
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
