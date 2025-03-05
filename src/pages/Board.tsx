import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import BoardContainer from '@/components/board/BoardContainer';
import BoardNotFound from '@/components/board/BoardNotFound';
import BoardSkeleton from '@/components/board/BoardSkeleton';
import { Status, Ticket } from '@/lib/types';
import { supabaseService } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import CreateTicketModal from '@/components/CreateTicketModal';

const Board = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const isValidUuid = (id) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  };
  
  const { 
    data: board, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['board', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      
      if (!isValidUuid(projectId)) {
        toast.error('Invalid project ID format');
        throw new Error('Invalid project ID format');
      }
      
      const boardData = await supabaseService.createBoard(projectId);
      console.log('Board data loaded:', boardData);
      return boardData;
    },
    enabled: !!projectId && isValidUuid(projectId),
  });

  useEffect(() => {
    console.log('Board component mounted with projectId:', projectId);
    
    if (projectId && !isValidUuid(projectId)) {
      toast.error('Invalid project ID format');
      navigate('/');
    }
  }, [projectId, navigate]);

  if (!projectId || !isValidUuid(projectId)) {
    return (
      <Layout>
        <div className="px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Invalid Project ID</h2>
          <p className="text-muted-foreground mb-4">The project ID format is not valid. Please check the URL and try again.</p>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

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
        <BoardNotFound projectId={projectId} />
      </Layout>
    );
  }

  const handleTicketMove = async (ticketId: string, sourceColumn: Status, destinationColumn: Status) => {
    try {
      console.log(`Moving ticket ${ticketId} from ${sourceColumn} to ${destinationColumn}`);
      
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
      
      await supabaseService.updateTicket(ticketId, { 
        ...foundTicket, 
        status: destinationColumn 
      });
      
      toast.success(`Ticket moved to ${destinationColumn.replace(/-/g, ' ')}`);
      
      refetch();
    } catch (error) {
      console.error('Error moving ticket:', error);
      toast.error('Failed to move ticket');
    }
  };

  const handleCreateTicket = async (ticket: Ticket) => {
    try {
      console.log('Creating new ticket from Board.tsx:', ticket);
      
      if (!ticket.id) {
        console.error('Ticket has no ID:', ticket);
        toast.error('Cannot create ticket: Missing ID');
        return false;
      }
      
      const result = await supabaseService.createTicket(ticket);
      if (result) {
        console.log('Ticket created successfully:', result);
        toast.success('Ticket created successfully');
        refetch();
        return true;
      } else {
        console.error('Failed to create ticket');
        toast.error('Failed to create ticket');
        return false;
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
      return false;
    } finally {
      setIsCreateModalOpen(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <BoardContainer 
          projectId={projectId} 
          boardName={board.name}
          onCreateTicket={() => setIsCreateModalOpen(true)}
          onTicketMove={handleTicketMove}
        />
        
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
